import { useMemo, useState, type FormEvent } from 'react'
import type { GuildBankTransaction } from '../data/guildData'
import type { GuildMember } from '../data/members'
import { useGuildRecords } from '../data/useGuildRecords'
import { Icon } from './Icon'

type TransactionType = 'Deposit' | 'Withdraw'

function formatSilver(amount: number) {
  return new Intl.NumberFormat('en-US').format(amount)
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function GuildBank({
  canManage,
  members,
  ownMemberId,
}: {
  canManage: boolean
  members: GuildMember[]
  ownMemberId: string | null
}) {
  const { records: transactions, isLoading, error, create, update, remove } =
    useGuildRecords<GuildBankTransaction>('guild_bank_transactions', true)
  const [dialogType, setDialogType] = useState<TransactionType | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<GuildBankTransaction | null>(null)
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const canWriteBank = canManage

  const balance = useMemo(
    () => transactions.reduce((total, transaction) =>
      total + (transaction.type === 'Deposit' ? transaction.amount : -transaction.amount), 0),
    [transactions],
  )
  const totalDeposited = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'Deposit')
      .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  )
  const totalWithdrawn = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'Withdraw')
      .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  )
  const memberDeposits = useMemo(() => {
    const deposits = new Map(members.map((member) => [member.id, 0]))
    transactions.forEach((transaction) => {
      if (transaction.type === 'Deposit') {
        deposits.set(transaction.member_id, (deposits.get(transaction.member_id) ?? 0) + transaction.amount)
      }
    })
    return deposits
  }, [members, transactions])

  const openDialog = (type: TransactionType, transaction?: GuildBankTransaction) => {
    setDialogType(type)
    setEditingTransaction(transaction ?? null)
    setMemberId(transaction?.member_id ?? ownMemberId ?? members[0]?.id ?? '')
    setAmount(transaction ? String(transaction.amount) : '')
    setNote(transaction?.note ?? '')
    setFormError('')
  }

  const closeDialog = () => {
    setDialogType(null)
    setEditingTransaction(null)
    setFormError('')
  }

  const submitTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (
      !dialogType ||
      !memberId ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      setFormError('Choose a guild member and enter a whole silver amount greater than zero.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const record = {
        member_id: memberId,
        type: dialogType,
        amount: numericAmount,
        note: note.trim() || (dialogType === 'Deposit' ? 'Guild contribution' : 'Guild expense'),
      }
      if (editingTransaction) await update(editingTransaction.id, record)
      else await create(record)
      closeDialog()
    } catch (saveError) {
      console.error('Unable to save guild bank transaction.', saveError)
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to save this transaction.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTransaction = async (transaction: GuildBankTransaction) => {
    if (!window.confirm('Delete this transaction? The bank balance will be recalculated.')) return
    setActionError('')
    try {
      await remove(transaction.id)
    } catch (deleteError) {
      console.error('Unable to delete guild bank transaction.', deleteError)
      setActionError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this transaction.')
    }
  }

  return (
    <section className="guild-bank-page" aria-label="Guild bank">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> GUILD TREASURY</div>
          <h1>Guild bank</h1>
          <p className="page-description">Track New Era Youths silver, member contributions, and withdrawals.</p>
        </div>
        {canWriteBank && (
          <div className="bank-actions">
            <button className="bank-withdraw-button" disabled={members.length === 0} onClick={() => openDialog('Withdraw')} type="button"><Icon name="download" /> Withdraw</button>
            <button className="invite-button" disabled={members.length === 0} onClick={() => openDialog('Deposit')} type="button"><Icon name="plus" /> Deposit silver</button>
          </div>
        )}
      </div>

      <section className="bank-stats-grid" aria-label="Guild bank summary">
        <article className="bank-stat-card balance">
          <div className="bank-stat-top"><span className="stat-icon gold"><Icon name="coins" /></span><span className="bank-stat-caption">AVAILABLE</span></div>
          <span className="stat-label">BANK BALANCE</span>
          <strong className="bank-stat-value">{formatSilver(balance)} <small>silver</small></strong>
        </article>
        <article className="bank-stat-card">
          <div className="bank-stat-top"><span className="stat-icon green"><Icon name="trendUp" /></span><span className="bank-stat-caption">ALL TIME</span></div>
          <span className="stat-label">TOTAL DEPOSITED</span>
          <strong className="bank-stat-value">{formatSilver(totalDeposited)} <small>silver</small></strong>
        </article>
        <article className="bank-stat-card">
          <div className="bank-stat-top"><span className="stat-icon blue"><Icon name="download" /></span><span className="bank-stat-caption">ALL TIME</span></div>
          <span className="stat-label">TOTAL WITHDRAWN</span>
          <strong className="bank-stat-value">{formatSilver(totalWithdrawn)} <small>silver</small></strong>
        </article>
      </section>
      {(error || actionError) && <p className="crud-error" role="alert">{error || actionError}</p>}

      <section className="bank-panel">
        <div className="bank-panel-heading">
          <div><h2>Member deposits <span>{members.length}</span></h2><p>Total silver each member has deposited.</p></div>
        </div>
        <div className="bank-member-grid">
          {members.map((member) => (
            <article className="bank-member-card" key={member.id}>
              <span className={`member-avatar ${member.avatarTone}`}>{member.avatar}</span>
              <span className="bank-member-copy"><strong>{member.name}</strong><small>{member.role}</small></span>
              <span className="bank-member-amount">{formatSilver(memberDeposits.get(member.id) ?? 0)} <small>silver</small></span>
            </article>
          ))}
          {members.length === 0 && <p className="crud-status">Add guild members before recording transactions.</p>}
        </div>
      </section>

      <section className="bank-panel transactions-panel">
        <div className="bank-panel-heading">
          <div><h2>Recent transactions <span>{transactions.length}</span></h2><p>Deposits and withdrawals saved to the guild database.</p></div>
        </div>
        {isLoading ? <p className="crud-status" role="status">Loading bank transactions…</p> : transactions.length > 0 ? (
          <div className="bank-transaction-list">
            {transactions.map((transaction) => (
              <article className="bank-transaction" key={transaction.id}>
                <span className={`bank-transaction-icon ${transaction.type.toLowerCase()}`}><Icon name={transaction.type === 'Deposit' ? 'trendUp' : 'download'} /></span>
                <span className="bank-transaction-copy">
                  <strong>{transaction.member?.name ?? 'Unknown member'} <small>{transaction.type === 'Deposit' ? 'deposited silver' : 'withdrew silver'}</small></strong>
                  <span>{transaction.note} · {formatTransactionDate(transaction.created_at)}</span>
                </span>
                <strong className={`bank-transaction-amount ${transaction.type.toLowerCase()}`}>{transaction.type === 'Deposit' ? '+' : '−'}{formatSilver(transaction.amount)} silver</strong>
                {canManage && (
                  <div className="crud-actions">
                    <button className="export-button" onClick={() => openDialog(transaction.type, transaction)} type="button">Edit</button>
                    <button className="export-button danger-action" onClick={() => void deleteTransaction(transaction)} type="button">Delete</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="bank-empty-state">
            <span className="empty-icon"><Icon name="coins" /></span>
            <strong>No transactions yet</strong>
            <span>Deposits and withdrawals will appear here.</span>
          </div>
        )}
      </section>

      {dialogType && (
        <div className="picker-backdrop" onMouseDown={closeDialog}>
          <section aria-labelledby="bank-dialog-title" aria-modal="true" className="rule-dialog bank-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="picker-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> GUILD TREASURY</div>
                <h2 id="bank-dialog-title">{editingTransaction ? 'Edit' : dialogType} silver</h2>
                <p>{editingTransaction ? 'Update the transaction details.' : dialogType === 'Deposit' ? 'Record a member contribution to the guild bank.' : 'Record silver withdrawn from the guild bank.'}</p>
              </div>
              <button aria-label="Close dialog" className="picker-close" onClick={closeDialog} type="button"><Icon name="close" /></button>
            </div>
            <form className="rule-form" onSubmit={(event) => void submitTransaction(event)}>
              <label className="build-field">
                <span>Guild member</span>
                <select onChange={(event) => setMemberId(event.target.value)} required value={memberId}>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </label>
              <label className="build-field">
                <span>Transaction type</span>
                <select onChange={(event) => setDialogType(event.target.value as TransactionType)} value={dialogType}>
                  <option>Deposit</option><option>Withdraw</option>
                </select>
              </label>
              <label className="build-field"><span>Silver amount</span><input inputMode="numeric" min="1" onChange={(event) => setAmount(event.target.value)} placeholder="Enter whole silver amount" required step="1" type="number" value={amount} /></label>
              <label className="build-field"><span>Note</span><input maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Optional reason or note" value={note} /></label>
              {formError && <p className="crud-error" role="alert">{formError}</p>}
              <div className="create-build-footer">
                <button className="build-cancel-button" onClick={closeDialog} type="button">Cancel</button>
                <button className="invite-button" disabled={isSaving} type="submit"><Icon name={editingTransaction ? 'download' : dialogType === 'Deposit' ? 'plus' : 'download'} /> {isSaving ? 'Saving…' : editingTransaction ? 'Save transaction' : `${dialogType} silver`}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
