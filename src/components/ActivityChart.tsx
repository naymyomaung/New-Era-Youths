import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, Filler, LineController, LineElement, LinearScale, PointElement, Tooltip)

export function ActivityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const chart = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
        datasets: [{
          data: [25, 30, 28, 42, 38, 51, 47, 68],
          borderColor: '#78a88a',
          borderWidth: 2,
          fill: true,
          backgroundColor: (context) => {
            const { chart: currentChart } = context
            const { ctx, chartArea } = currentChart
            if (!chartArea) return 'rgba(120, 168, 138, 0.12)'
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, 'rgba(120, 168, 138, 0.25)')
            gradient.addColorStop(1, 'rgba(120, 168, 138, 0)')
            return gradient
          },
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#9dc6a9',
          tension: 0.42,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, min: 0, max: 80, grid: { display: false } },
        },
        interaction: { intersect: false, mode: 'index' },
      },
    })

    return () => chart.destroy()
  }, [])

  return (
    <article className="stat-card activity-card">
      <div className="stat-top"><span className="stat-icon mint"><span className="chart-spark">↗</span></span><span className="stat-trend"><IconTrend /> 18.6%</span></div>
      <span className="stat-label">GUILD ACTIVITY</span>
      <strong className="stat-value">+18.6<span>%</span></strong>
      <p className="stat-note">Activity this season</p>
      <div className="activity-chart"><canvas ref={canvasRef} aria-label="Guild activity trend over eight weeks" role="img" /></div>
    </article>
  )
}

function IconTrend() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 16 16"><path d="m2 11 4-4 3 3 5-6M10 4h4v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
}
