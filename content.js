const STORAGE_KEY = "ivelt_hidden_topics";
const ICON_HIDE = `<svg fill="#555" height="18px" width="18px" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
const ICON_UNHIDE = `<svg fill="#d9534f" height="18px" width="18px" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.39 2.72-3.12 3.44-5.08-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

chrome.storage.local.get([STORAGE_KEY], (result) => {
  const hiddenIds = result[STORAGE_KEY] || [];
  init(hiddenIds);
});

function init(hiddenIds) {
  const topicLists = document.querySelectorAll(".topiclist.topics");
  if (topicLists.length === 0) return;

  const { vaultList, statsBar, toggleBtn } = createVaultUI();

  topicLists.forEach((list, listIdx) => {
    const topics = list.querySelectorAll("li.row");

    topics.forEach((topicRow) => {
      const link = topicRow.querySelector("a.topictitle");
      if (!link) return;

      const topicId = new URLSearchParams(link.href.split("?")[1]).get("t");
      if (!topicId) return;

      topicRow.dataset.originalParentIdx = listIdx;

      const innerDiv = topicRow.querySelector(".list-inner");
      const actionBtn = document.createElement("span");
      actionBtn.className = "hide-topic-btn";
      innerDiv.prepend(actionBtn);

      if (hiddenIds.includes(topicId)) {
        updateButtonState(actionBtn, true);
        vaultList.appendChild(topicRow);
      } else {
        updateButtonState(actionBtn, false);
      }

      actionBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle(
          topicId,
          topicRow,
          actionBtn,
          vaultList,
          statsBar,
          topicLists,
          toggleBtn
        );
      });
    });
  });
  updateStats(vaultList, statsBar, toggleBtn);
}

function handleToggle(topicId, row, btn, vault, stats, allLists, toggleBtn) {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    let ids = res[STORAGE_KEY] || [];
    const isCurrentlyHidden = ids.includes(topicId);

    if (isCurrentlyHidden) {
      ids = ids.filter((id) => id !== topicId);
      const originalList = allLists[row.dataset.originalParentIdx];
      originalList.appendChild(row);
      updateButtonState(btn, false);
    } else {
      ids.push(topicId);
      vault.appendChild(row);
      updateButtonState(btn, true);
    }

    chrome.storage.local.set({ [STORAGE_KEY]: ids }, () => {
      updateStats(vault, stats, toggleBtn);
    });
  });
}

function updateButtonState(btn, isHidden) {
  btn.innerHTML = isHidden ? ICON_UNHIDE : ICON_HIDE;
  btn.title = isHidden ? "Unhide topic" : "Hide topic";
  btn.classList.toggle("unhide-style", isHidden);
}

function createVaultUI() {
  const allForumBlocks = document.querySelectorAll(".forumbg");
  const lastBlock = allForumBlocks[allForumBlocks.length - 1];

  const container = document.createElement("div");
  container.id = "ivelt-hidden-vault-container";
  container.innerHTML = `
        <div class="vault-header">
            <span style="color: white !important;">Hidden Topics Vault</span>
            <button type="button" class="vault-toggle-btn" id="ivelt-vault-toggle">Show Hidden Topics</button>
        </div>
        <div id="ivelt-stats-bar"></div>
        <ul id="ivelt-hidden-vault-list" class="topiclist topics" style="display: none !important;"></ul>
    `;

  lastBlock.after(container);

  const vaultList = container.querySelector("#ivelt-hidden-vault-list");
  const statsBar = container.querySelector("#ivelt-stats-bar");
  const toggleBtn = container.querySelector("#ivelt-vault-toggle");

  toggleBtn.addEventListener("click", () => {
    const isHidden =
      vaultList.style.display === "none" ||
      vaultList.style.getPropertyValue("display") === "none";
    vaultList.style.setProperty(
      "display",
      isHidden ? "block" : "none",
      "important"
    );
    toggleBtn.innerText = isHidden ? "Collapse Vault" : "Show Hidden Topics";
  });

  return { vaultList, statsBar, toggleBtn };
}

function updateStats(vaultList, statsBar, toggleBtn) {
  const hiddenRows = vaultList.querySelectorAll("li.row");
  const total = hiddenRows.length;
  let unread = 0;
  hiddenRows.forEach((row) => {
    const dl = row.querySelector("dl");
    if (dl && dl.className.includes("unread")) unread++;
  });
  statsBar.innerHTML = `Total hidden: <b>${total}</b> (<b>${unread}</b> unread).`;
}
