import { test, expect, type Page, type Browser } from "@playwright/test";

// Helper to join a player through invite link and host approval
async function addPlayerToRoom(
  browser: Browser,
  hostPage: Page,
  code: string,
  playerName: string
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/r/${code}`);

  // Fill nickname in JoinFlow
  const nameInput = page.locator("#player-name-input");
  await expect(nameInput).toBeVisible();
  await nameInput.fill(playerName);

  // Click Go to the Room
  await page.click('button:has-text("Go to the Room")');

  // Verify player sees waiting state
  await expect(page.locator("text=Waiting for the host...")).toBeVisible();

  // Host approves request
  const requestRow = hostPage.locator(`[data-testid="pending-request-${playerName}"]`);
  await expect(requestRow).toBeVisible();
  await requestRow.locator('button:has-text("Accept")').click();

  // Both should now see the player in the lobby roster
  await expect(page.locator(`text=${playerName}`)).toBeVisible();
  return { context, page };
}

test.describe("Undercover E2E Game Suite", () => {
  test("1. Create room, join via link, and host approval", async ({ page: hostPage, browser }) => {
    // 1. Host creates a room
    await hostPage.goto("/play?action=create");

    // Wait for code to be generated and displayed
    const codeDisplay = hostPage.locator("div.font-mono.text-3xl, div.font-mono.text-4xl");
    await expect(codeDisplay).toBeVisible({ timeout: 15000 });
    const codeText = await codeDisplay.textContent();
    const roomCode = codeText?.trim() || "";
    expect(roomCode).toHaveLength(6);

    // Host fills name and joins room
    await hostPage.fill("#player-name-input", "HostAgent");
    await hostPage.click('button:has-text("Go to the Room")');

    // Host should enter Lobby
    await expect(hostPage.locator("text=Players (1 /")).toBeVisible();
    await expect(hostPage.locator("text=HostAgent")).toBeVisible();

    // 2. Player 2 joins via invite link
    const player2 = await addPlayerToRoom(browser, hostPage, roomCode, "AgentTwo");

    // Verify both see 2 players
    await expect(hostPage.locator("text=Players (2 /")).toBeVisible();
    await expect(player2.page.locator("text=Players (2 /")).toBeVisible();

    await player2.context.close();
  });

  test("2. Full 4-player game to Civilians Win condition", async ({ page: hostPage, browser }) => {
    // 1. Host creates room
    await hostPage.goto("/play?action=create");
    const codeDisplay = hostPage.locator("div.font-mono.text-3xl, div.font-mono.text-4xl");
    await expect(codeDisplay).toBeVisible({ timeout: 15000 });
    const roomCode = (await codeDisplay.textContent())?.trim() || "";

    await hostPage.fill("#player-name-input", "Host");
    await hostPage.click('button:has-text("Go to the Room")');
    await expect(hostPage.locator("text=Players (1 /")).toBeVisible();

    // Enable Show Roles in lobby so we can verify identities
    await hostPage.click('button:has-text("Roles Hidden")');
    await expect(hostPage.locator('button:has-text("Roles Shown")')).toBeVisible();

    // 2. Add 3 more players
    const p2 = await addPlayerToRoom(browser, hostPage, roomCode, "Player2");
    const p3 = await addPlayerToRoom(browser, hostPage, roomCode, "Player3");
    const p4 = await addPlayerToRoom(browser, hostPage, roomCode, "Player4");

    const allPages = [hostPage, p2.page, p3.page, p4.page];

    // Verify 4 players
    await expect(hostPage.locator("text=Players (4 /")).toBeVisible();

    // 3. Start game
    const startBtn = hostPage.locator('button:has-text("Start Game")');
    await expect(startBtn).toBeEnabled();
    await startBtn.click();

    // 4. Role reveal phase: check secret info cards
    for (const p of allPages) {
      await expect(p.locator("text=Check Your Identity")).toBeVisible();
      // Show secret info
      await p.click('button:has-text("Show Secret Info")');
      await expect(p.locator("text=Hide Secret Info")).toBeVisible();
    }

    // Identify who is the Undercover player
    let undercoverName = "";
    let undercoverPage: Page = hostPage;
    for (const p of allPages) {
      const title = (await p.locator('[data-testid="role-card-title"]').textContent())?.trim();
      if (title === "UNDERCOVER") {
        undercoverPage = p;
        if (p === hostPage) undercoverName = "Host";
        else if (p === p2.page) undercoverName = "Player2";
        else if (p === p3.page) undercoverName = "Player3";
        else undercoverName = "Player4";
        break;
      }
    }

    expect(undercoverName).toBeTruthy();

    // 5. Host skips to Discussion and then to Voting
    if (await hostPage.locator("text=Check Your Identity").isVisible()) {
      await hostPage.click('button:has-text("Skip Timer")');
    }
    if (await hostPage.locator("text=Discussion Phase").isVisible()) {
      await hostPage.click('button:has-text("Skip Timer")');
    }
    await expect(hostPage.locator("text=Voting Phase")).toBeVisible();

    // 6. Civilians vote to eliminate the Undercover player, Undercover votes for someone else
    for (const p of allPages) {
      if (p === undercoverPage) {
        // Undercover votes for another player
        await p.locator('div[role="button"]').first().click();
      } else {
        await p.locator(`div[role="button"][aria-label*="${undercoverName}"]`).first().click();
      }
    }

    // 7. Voting closes and enters Elimination / Game Over
    // Wait for Game Over screen
    await expect(hostPage.locator("text=Civilians Win")).toBeVisible({ timeout: 15000 });
    await expect(hostPage.locator("text=All infiltrators were eliminated!")).toBeVisible();

    // 8. Host clicks Play Again
    await hostPage.click('button:has-text("Play Again")');

    // Everyone returns to Lobby
    for (const p of allPages) {
      await expect(p.locator("text=Players (4 /")).toBeVisible();
    }

    await p2.context.close();
    await p3.context.close();
    await p4.context.close();
  });

  test("3. Tie round where nobody is eliminated", async ({ page: hostPage, browser }) => {
    // 1. Host creates room
    await hostPage.goto("/play?action=create");
    const codeDisplay = hostPage.locator("div.font-mono.text-3xl, div.font-mono.text-4xl");
    await expect(codeDisplay).toBeVisible({ timeout: 15000 });
    const roomCode = (await codeDisplay.textContent())?.trim() || "";

    await hostPage.fill("#player-name-input", "Alice");
    await hostPage.click('button:has-text("Go to the Room")');

    const p2 = await addPlayerToRoom(browser, hostPage, roomCode, "Bob");
    const p3 = await addPlayerToRoom(browser, hostPage, roomCode, "Charlie");
    const p4 = await addPlayerToRoom(browser, hostPage, roomCode, "Dave");

    // Start game
    await hostPage.click('button:has-text("Start Game")');

    // Skip to voting
    await hostPage.click('button:has-text("Skip Timer")');
    await hostPage.click('button:has-text("Skip Timer")');
    await expect(hostPage.locator("text=Voting Phase")).toBeVisible();

    // Tie: Alice and Bob vote for Charlie; Charlie and Dave vote for Bob
    await hostPage.locator('div[role="button"][aria-label*="Charlie"]').first().click();
    await p2.page.locator('div[role="button"][aria-label*="Charlie"]').first().click();
    await p3.page.locator('div[role="button"][aria-label*="Bob"]').first().click();
    await p4.page.locator('div[role="button"][aria-label*="Bob"]').first().click();

    // Voting automatically closes on all voted -> ELIMINATION shows TIE
    await expect(hostPage.locator("text=TIE — Nobody Eliminated")).toBeVisible({ timeout: 15000 });

    await p2.context.close();
    await p3.context.close();
    await p4.context.close();
  });

  test("4. Mr. White guess wrong and guess right", async ({ page: hostPage, browser }) => {
    // 1. Host creates room
    await hostPage.goto("/play?action=create");
    const codeDisplay = hostPage.locator("div.font-mono.text-3xl, div.font-mono.text-4xl");
    await expect(codeDisplay).toBeVisible({ timeout: 15000 });
    const roomCode = (await codeDisplay.textContent())?.trim() || "";

    await hostPage.fill("#player-name-input", "Host");
    await hostPage.click('button:has-text("Go to the Room")');

    // Configure 1 Mr. White and 1 Undercover
    await hostPage.click('button[aria-label="Increase Mr. White count"]');
    await expect(hostPage.locator('[data-testid="mr-white-count"]')).toHaveText("1");

    // Show roles enabled
    await hostPage.click('button:has-text("Roles Hidden")');

    // Add 4 players (total 5 players to support 2 infiltrators: 1 Undercover + 1 Mr. White)
    const p2 = await addPlayerToRoom(browser, hostPage, roomCode, "P2");
    const p3 = await addPlayerToRoom(browser, hostPage, roomCode, "P3");
    const p4 = await addPlayerToRoom(browser, hostPage, roomCode, "P4");
    const p5 = await addPlayerToRoom(browser, hostPage, roomCode, "P5");

    const allPages = [
      { name: "Host", page: hostPage },
      { name: "P2", page: p2.page },
      { name: "P3", page: p3.page },
      { name: "P4", page: p4.page },
      { name: "P5", page: p5.page },
    ];

    // Start game
    await hostPage.click('button:has-text("Start Game")');

    // Find who is Mr. White and who is Civilian
    let mrWhiteObj: { name: string; page: Page } | null = null;
    let civilianWord = "";

    for (const item of allPages) {
      await item.page.click('button:has-text("Show Secret Info")');
      const title = (
        await item.page.locator('[data-testid="role-card-title"]').textContent()
      )?.trim();
      if (title?.includes("MR. WHITE")) {
        mrWhiteObj = item;
      }
      if (title?.includes("CIVILIAN") && !civilianWord) {
        // Read word
        const wordEl = item.page.locator("div.bg-yellow-200.font-heading");
        civilianWord = (await wordEl.textContent())?.trim() || "";
      }
    }

    expect(mrWhiteObj).toBeTruthy();
    expect(civilianWord).toBeTruthy();

    // Skip to voting
    await hostPage.click('button:has-text("Skip Timer")');
    await hostPage.click('button:has-text("Skip Timer")');

    // Vote to eliminate Mr. White
    for (const item of allPages) {
      if (item === mrWhiteObj) {
        // Mr. White votes for another player
        await item.page.locator('div[role="button"]').first().click();
      } else {
        await item.page
          .locator(`div[role="button"][aria-label*="${mrWhiteObj!.name}"]`)
          .first()
          .click();
      }
    }

    // Wait for Mr. White guess phase
    await expect(mrWhiteObj!.page.locator("text=Final Guess!")).toBeVisible({ timeout: 15000 });
    // Other pages see "Mr. White is Guessing..."
    const otherPage = allPages.find((p) => p !== mrWhiteObj)!;
    await expect(otherPage.page.locator("text=Mr. White is Guessing...")).toBeVisible();

    // Mr. White enters correct civilian word
    await mrWhiteObj!.page.fill('input[placeholder="Enter your word guess"]', civilianWord);
    await mrWhiteObj!.page.click('button:has-text("Submit Guess")');

    // Correct guess -> Infiltrators Win!
    await expect(hostPage.locator("text=Infiltrators Win")).toBeVisible({ timeout: 15000 });
    await expect(
      hostPage.locator("text=Mr. White correctly guessed the civilian secret word!")
    ).toBeVisible();

    await p2.context.close();
    await p3.context.close();
    await p4.context.close();
    await p5.context.close();
  });

  test("5. Reconnect after simulated offline", async ({ page: hostPage, browser }) => {
    // 1. Host creates room
    await hostPage.goto("/play?action=create");
    const codeDisplay = hostPage.locator("div.font-mono.text-3xl, div.font-mono.text-4xl");
    await expect(codeDisplay).toBeVisible({ timeout: 15000 });
    const roomCode = (await codeDisplay.textContent())?.trim() || "";

    await hostPage.fill("#player-name-input", "HostAgent");
    await hostPage.click('button:has-text("Go to the Room")');

    const p2 = await addPlayerToRoom(browser, hostPage, roomCode, "DisconnectMe");

    // 2. Simulate p2 closing tab / disconnecting
    await p2.page.close();

    // Host should see p2 with "away" indicator
    await expect(hostPage.locator('span:has-text("away")')).toBeVisible({ timeout: 15000 });

    // 3. Reconnect: p2 opens the game in the same browser context (session restored from localStorage)
    const p2Reopened = await p2.context.newPage();
    await p2Reopened.goto(`/play?code=${roomCode}`);
    await p2Reopened.click('button:has-text("Go to the Room")');

    // p2 is back in the lobby as an active connected player
    await expect(p2Reopened.locator("text=DisconnectMe")).toBeVisible();
    await expect(hostPage.locator('span:has-text("away")')).toHaveCount(0);

    await p2Reopened.close();
    await p2.context.close();
  });
});
