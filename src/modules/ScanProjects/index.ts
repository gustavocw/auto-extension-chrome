export async function scanProject() {
  function isProjectPage(): boolean {
    return window.location.href.includes("workana.com/job/");
  }

  function getProjectDescription(): string | null {
    const expander = document.querySelector("div.expander.js-expander-passed");
    return expander?.textContent?.trim() || null;
  }

  function saveDescription(description: string) {
    try {
      localStorage.setItem("workana_project_description", description);
    } catch (error) {
    }
  }

  function highlightButton(button: HTMLAnchorElement) {
    button.style.transition = "box-shadow 0.3s, transform 0.3s";
    button.style.boxShadow = "0 0 10px 2px #4CAF50";
    button.style.transform = "scale(1.05)";

    setTimeout(() => {
      button.style.boxShadow = "";
      button.style.transform = "";
    }, 600);
  }

  function clickBidButton(): void {
    const bidButton = document.getElementById(
      "bid_button"
    ) as HTMLAnchorElement | null;
    if (bidButton) {
      highlightButton(bidButton);

      setTimeout(() => {
        bidButton.click();
      }, 800);
    }
  }

  if (isProjectPage()) {
    const description = getProjectDescription();
    if (description) {
      saveDescription(description);
    }

    setTimeout(() => {
      clickBidButton();
    }, Math.floor(1000 + Math.random() * 500));
  }
}
