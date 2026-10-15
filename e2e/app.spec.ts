import { test, expect } from '@playwright/test'

test('carrega página inicial', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/AprovaQuest/)
})

test('navega para questões', async ({ page }) => {
  await page.goto('/questoes')
  await expect(page.getByRole('heading', { name: /Questões/ })).toBeVisible()
})

test('navega para importar', async ({ page }) => {
  await page.goto('/importar')
  await expect(page.getByRole('heading', { name: /Importar/ })).toBeVisible()
})
