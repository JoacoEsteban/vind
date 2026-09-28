export function themeController(node: HTMLElement): void {
  node.setAttribute('data-vind-theme-root', '')
  node.style.setProperty('display', 'contents')

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) node.setAttribute('data-theme', 'dark')
    else node.setAttribute('data-theme', 'light')
  })

  node.setAttribute(
    'data-theme',
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  node.classList.add(`browser-${import.meta.env.BROWSER}`)
}
