import { useState, type FormEvent } from 'react'
import guildLogo from '../assets/logo.jpg'
import { FunctionsHttpError } from '@supabase/supabase-js'
import {
  saveAuthSession,
  toAuthUser,
  type AuthUser,
} from '../data/authStorage'
import { supabase } from '../data/supabase'
import { Icon } from './Icon'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

async function submitAuthRequest(body: Record<string, unknown>): Promise<AuthUser> {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env.local file.')
  const { data, error } = await supabase.functions.invoke<{
    session_token: string
    user: unknown
  }>('game-name-auth', { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = await error.context.json() as { error?: unknown }
      if (typeof response.error === 'string') throw new Error(response.error)
    }
    throw error
  }
  if (!data || typeof data.session_token !== 'string') {
    throw new Error('The authentication service returned an invalid session.')
  }
  const user = toAuthUser(data.user)
  if (!user) throw new Error('The authentication service returned invalid user details.')
  saveAuthSession(data.session_token)
  return user
}

export function AuthPages({
  onAuthenticated,
  initialError = '',
}: {
  onAuthenticated: (user: AuthUser) => void
  initialError?: string
}) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [gameName, setGameName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totalFame, setTotalFame] = useState('')
  const [currentSilver, setCurrentSilver] = useState('')
  const [currentSet, setCurrentSet] = useState('Not selected')
  const [guildCode, setGuildCode] = useState('')
  const [errorMessage, setErrorMessage] = useState(initialError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const switchMode = (nextMode: 'sign-in' | 'sign-up') => {
    setMode(nextMode)
    setErrorMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  const submitSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const user = await submitAuthRequest({
        action: 'sign-in',
        gameName: gameName.trim(),
        password,
      })
      onAuthenticated(user)
    } catch (error) {
      console.error('Unable to sign in.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    const normalizedName = gameName.trim()
    const fame = Number(totalFame)
    const silver = Number(currentSilver)
    if (!normalizedName) {
      setErrorMessage('Enter your in-game name.')
      return
    }
    if (!Number.isFinite(fame) || fame < 0 || !Number.isSafeInteger(silver) || silver < 0) {
      setErrorMessage('Enter valid non-negative fame and silver amounts.')
      return
    }
    if (!passwordPattern.test(password)) {
      setErrorMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('The passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await submitAuthRequest({
        action: 'sign-up',
        gameName: normalizedName,
        password,
        profile: {
          total_fame: fame,
          current_silver: silver,
          current_set: currentSet,
          guild_code: guildCode.trim(),
        },
      })
      onAuthenticated(user)
    } catch (error) {
      console.error('Unable to create an account.', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create an account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <img alt="" src={guildLogo} />
          <span>NEW ERA YOUTHS</span>
        </div>
        <div className="auth-heading">
          <div className="eyebrow"><span className="eyebrow-line" /> GUILD MEMBER ACCESS</div>
          <h1 id="auth-title">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1>
          <p>{mode === 'sign-in' ? 'Sign in to continue to the guild dashboard.' : 'Create a member profile for New Era Youths.'}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Account action">
          <button aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'selected' : ''} onClick={() => switchMode('sign-in')} role="tab" type="button">Sign in</button>
          <button aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'selected' : ''} onClick={() => switchMode('sign-up')} role="tab" type="button">Sign up</button>
        </div>

        <form className="auth-form" onSubmit={mode === 'sign-in' ? submitSignIn : submitSignUp}>
          <label className="build-field">
            <span>In-game name</span>
            <input autoComplete="username" onChange={(event) => setGameName(event.target.value)} placeholder="Enter your character name" required value={gameName} />
          </label>

          {mode === 'sign-up' && (
            <>
              <div className="auth-number-fields">
                <label className="build-field">
                  <span>Total fame</span>
                  <input inputMode="decimal" min="0" onChange={(event) => setTotalFame(event.target.value)} placeholder="0" required step="any" type="number" value={totalFame} />
                </label>
                <label className="build-field">
                  <span>Current silver</span>
                  <input inputMode="numeric" min="0" onChange={(event) => setCurrentSilver(event.target.value)} placeholder="0" required step="1" type="number" value={currentSilver} />
                </label>
              </div>
              <label className="build-field">
                <span>Current set / build</span>
                <select onChange={(event) => setCurrentSet(event.target.value)} value={currentSet}>
                  <option>Not selected</option>
                  <option>Covenant War Build</option>
                  <option>Holy Support</option>
                  <option>Nature Healer</option>
                  <option>Dagger Assassin</option>
                  <option>Longbow Marksman</option>
                  <option>Ore Gatherer</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="build-field">
                <span>Guild code <small>(optional)</small></span>
                <input autoComplete="off" onChange={(event) => setGuildCode(event.target.value)} placeholder="Enter an invite code if you have one" value={guildCode} />
              </label>
            </>
          )}

          <label className="build-field">
            <span>Password</span>
            <input autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type="password" value={password} />
          </label>
          {mode === 'sign-up' && (
            <>
              <p className="password-help">At least 8 characters, with uppercase, lowercase, and a number.</p>
              <label className="build-field">
                <span>Confirm password</span>
                <input autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required type="password" value={confirmPassword} />
              </label>
            </>
          )}
          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
          <button className="invite-button auth-submit" disabled={isSubmitting} type="submit">
            <Icon name="arrowUpRight" /> {isSubmitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-storage-note">Your account is securely stored with Supabase.</p>
      </section>
    </main>
  )
}
