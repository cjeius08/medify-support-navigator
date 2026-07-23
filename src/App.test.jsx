// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) }
  });
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function openFinderWithResults() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /open room-size finder/i }));
  fireEvent.change(screen.getByTestId("finder-area"), { target: { value: "400" } });
  fireEvent.click(screen.getByTestId("finder-submit"));
}

describe("Purifier Finder customer response", () => {
  it("opens, scrolls to, and focuses the generated response", async () => {
    openFinderWithResults();

    fireEvent.click(await screen.findByTestId("select-response-ma-25"));
    const composer = await screen.findByTestId("finder-response-composer");

    await waitFor(() => expect(document.activeElement).toBe(composer));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "MA-25 response package" })).toBeTruthy();
    expect(screen.getByLabelText("Edit Email recommendation").value).toContain("400 sq ft");
    expect(screen.getByLabelText("Edit Email recommendation").value).toContain("MA-25");
    expect(screen.getByTestId("select-response-ma-25").getAttribute("aria-pressed")).toBe("true");
  });

  it("updates the response and selected state when another model is chosen", async () => {
    openFinderWithResults();

    fireEvent.click(await screen.findByTestId("select-response-ma-25"));
    await screen.findByRole("heading", { name: "MA-25 response package" });
    fireEvent.click(screen.getByTestId("select-response-ma-40"));

    expect(await screen.findByRole("heading", { name: "MA-40 response package" })).toBeTruthy();
    expect(screen.getByLabelText("Edit Email recommendation").value).toContain("MA-40");
    expect(screen.getByTestId("select-response-ma-40").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("select-response-ma-25").getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps customer details in memory and copies every channel", async () => {
    openFinderWithResults();
    fireEvent.click(await screen.findByTestId("select-response-ma-25"));
    await screen.findByRole("heading", { name: "MA-25 response package" });

    fireEvent.change(screen.getByPlaceholderText("Used only in this browser session"), {
      target: { value: "Chris" }
    });
    expect(Object.keys(localStorage).map((key) => localStorage.getItem(key)).join(" ")).not.toContain("Chris");

    for (const channel of ["Email", "Chat", "Call Script", "Internal Notes"]) {
      fireEvent.click(screen.getByRole("tab", { name: channel }));
      fireEvent.click(screen.getByRole("button", { name: `Copy ${channel}` }));
    }
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(4);
  });
});
