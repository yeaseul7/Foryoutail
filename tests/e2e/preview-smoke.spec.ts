import { expect, test } from '@playwright/test';

const DETAIL_PATH = '/shelter/413587202600220';

test('주요 페이지와 API가 정상 응답한다', async ({ request }) => {
  const pages = [
    '/',
    '/shelter',
    DETAIL_PATH,
    '/register',
    '/mypage/likes',
    '/terms',
    '/privacy',
  ];

  for (const path of pages) {
    const response = await request.get(path);
    expect(response.status(), `${path} returned ${response.status()}`).toBeLessThan(400);
  }

  const animals = await request.get('/api/shelter-data?pageNo=1&numOfRows=1');
  expect(animals.ok()).toBeTruthy();
  const animalsBody = (await animals.json()) as { error?: string };
  expect(animalsBody.error).toBeUndefined();

  const shelter = await request.get(
    '/api/shelter-info?care_reg_no=413587202600220',
  );
  expect(shelter.status()).toBeLessThan(500);
});

test('목록, 영문 전환, 로그인 UI가 브라우저에서 동작한다', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/shelter', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/꼬순내/);
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();

  const englishButton = page.getByRole('button', { name: 'EN', exact: true });
  await englishButton.click();
  await expect(englishButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: 'Adopt' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('동물 상세 페이지가 영문으로 렌더링된다', async ({ page }) => {
  await page.goto(DETAIL_PATH, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByText('Adoption inquiry')).toBeVisible();
  await expect(
    page.getByText('All times are in Korea Standard Time (KST, UTC+9).'),
  ).toBeVisible();
});
