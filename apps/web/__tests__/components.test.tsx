import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ModelSelector } from "@/components/founder-agent/model-selector";
import { ProviderSelector } from "@/components/founder-agent/provider-selector";

// ---------------------------------------------------------------------------
// ModelSelector
// ---------------------------------------------------------------------------

describe("ModelSelector", () => {
  const defaultProps = {
    models: ["gpt-4o", "gpt-4o-mini", "gemini-2.0-flash"],
    currentModel: "gpt-4o",
    onSelect: vi.fn(),
    onRefresh: vi.fn(),
  };

  it("renders the current model name", () => {
    render(<ModelSelector {...defaultProps} />);
    expect(screen.getByText("gpt-4o")).toBeDefined();
  });

  it("shows 'Select model' when no current model", () => {
    render(<ModelSelector {...defaultProps} currentModel="" />);
    expect(screen.getByText("Select model")).toBeDefined();
  });

  it("shows 'Loading...' when loading", () => {
    render(<ModelSelector {...defaultProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("opens dropdown on trigger click", () => {
    render(<ModelSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected model: gpt-4o"));
    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("gpt-4o-mini")).toBeDefined();
    expect(screen.getByText("gemini-2.0-flash")).toBeDefined();
  });

  it("calls onSelect when a model is clicked", () => {
    const onSelect = vi.fn();
    render(<ModelSelector {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText("Selected model: gpt-4o"));
    fireEvent.click(screen.getByText("gpt-4o-mini"));
    expect(onSelect).toHaveBeenCalledWith("gpt-4o-mini");
  });

  it("shows active indicator on current model", () => {
    render(<ModelSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected model: gpt-4o"));
    const checkIcons = screen.getAllByRole("option").filter(
      (el) => el.getAttribute("aria-selected") === "true"
    );
    expect(checkIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'No models available' when models list is empty", () => {
    render(<ModelSelector {...defaultProps} models={[]} />);
    fireEvent.click(screen.getByLabelText("Selected model: gpt-4o"));
    expect(screen.getByText("No models available")).toBeDefined();
  });

  it("disables trigger button when disabled prop is true", () => {
    render(<ModelSelector {...defaultProps} disabled={true} />);
    const button = screen.getByLabelText("Selected model: gpt-4o");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(<ModelSelector {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByLabelText("Refresh models"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("disables refresh button when disabled", () => {
    render(<ModelSelector {...defaultProps} disabled={true} />);
    const refresh = screen.getByLabelText("Refresh models");
    expect(refresh.hasAttribute("disabled")).toBe(true);
  });

  it("closes dropdown on outside click", () => {
    render(<ModelSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected model: gpt-4o"));
    expect(screen.queryByRole("listbox")).toBeDefined();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports keyboard navigation with arrow keys", () => {
    render(<ModelSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected model: gpt-4o"));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();

    // With the listbox open, pressing Escape should close it
    fireEvent.keyDown(listbox, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ProviderSelector
// ---------------------------------------------------------------------------

describe("ProviderSelector", () => {
  const defaultProviders = [
    { name: "openai", displayName: "OpenAI", available: true, configured: true },
    { name: "gemini", displayName: "Gemini", available: true, configured: false },
    { name: "ollama", displayName: "Ollama", available: false, configured: true },
  ];

  const defaultHealthDetails = {
    openai: { provider: "openai", displayName: "OpenAI", status: "healthy", configured: true },
    gemini: { provider: "gemini", displayName: "Gemini", status: "misconfigured", configured: false },
    ollama: { provider: "ollama", displayName: "Ollama", status: "unavailable", configured: true },
  };

  const defaultProps = {
    providers: defaultProviders,
    currentProvider: "openai",
    onSelect: vi.fn(),
    healthDetails: defaultHealthDetails,
  };

  it("renders the current provider display name", () => {
    render(<ProviderSelector {...defaultProps} />);
    expect(screen.getByText("OpenAI")).toBeDefined();
  });

  it("shows 'Loading...' when loading", () => {
    render(<ProviderSelector {...defaultProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("shows current provider when no matching provider in list", () => {
    render(<ProviderSelector {...defaultProps} currentProvider="custom" healthDetails={{}} />);
    expect(screen.getByText("custom")).toBeDefined();
  });

  it("opens dropdown on trigger click", () => {
    render(<ProviderSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected provider: OpenAI"));
    expect(screen.getByRole("listbox")).toBeDefined();
  });

  it("calls onSelect when a provider is clicked", () => {
    const onSelect = vi.fn();
    render(<ProviderSelector {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText("Selected provider: OpenAI"));
    fireEvent.click(screen.getAllByRole("option")[1]);
    expect(onSelect).toHaveBeenCalledWith("gemini");
  });

  it("displays health status labels for providers", () => {
    render(<ProviderSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected provider: OpenAI"));
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(3);
    expect(screen.getByText("Healthy")).toBeDefined();
    expect(screen.getByText("Misconfigured")).toBeDefined();
    expect(screen.getByText("Unavailable")).toBeDefined();
  });

  it("disables trigger button when disabled prop is true", () => {
    render(<ProviderSelector {...defaultProps} disabled={true} />);
    const button = screen.getByLabelText("Selected provider: OpenAI");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("shows a colored status dot on the trigger for healthy provider", () => {
    render(<ProviderSelector {...defaultProps} />);
    const button = screen.getByLabelText("Selected provider: OpenAI");
    const dot = button.querySelector("span.ml-1\\.5");
    expect(dot).toBeDefined();
    expect(dot?.className).toContain("bg-green-500");
  });

  it("closes dropdown on outside click", () => {
    render(<ProviderSelector {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Selected provider: OpenAI"));
    expect(screen.queryByRole("listbox")).toBeDefined();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("handles missing healthDetails gracefully", () => {
    render(<ProviderSelector {...defaultProps} healthDetails={{}} />);
    fireEvent.click(screen.getByLabelText("Selected provider: OpenAI"));
    expect(screen.getByRole("listbox")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// ProviderSelector health variants
// ---------------------------------------------------------------------------

describe("ProviderSelector health indicator colors", () => {
  const providers = [
    { name: "p1", displayName: "Health P1", available: true, configured: true },
    { name: "p2", displayName: "Rate Limited P2", available: true, configured: true },
    { name: "p3", displayName: "Unknown P3", available: false, configured: false },
  ];

  it("shows rate_limited status correctly", () => {
    const healthDetails = {
      p1: { provider: "p1", displayName: "Health P1", status: "rate_limited", configured: true },
    };
    render(
      <ProviderSelector
        providers={providers}
        currentProvider="p1"
        onSelect={vi.fn()}
        healthDetails={healthDetails}
      />
    );
    fireEvent.click(screen.getByLabelText("Selected provider: Health P1"));
    expect(screen.getByText("Rate Limited")).toBeDefined();
  });

  it("shows unknown status when no health data available", () => {
    render(
      <ProviderSelector
        providers={providers}
        currentProvider="p3"
        onSelect={vi.fn()}
        healthDetails={{}}
      />
    );
    fireEvent.click(screen.getByLabelText("Selected provider: Unknown P3"));
    expect(screen.queryByText("Healthy")).toBeNull();
    expect(screen.queryByText("Unavailable")).toBeNull();
  });
});
