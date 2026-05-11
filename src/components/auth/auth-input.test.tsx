// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuthInput } from "./auth-input";

describe("AuthInput — a11y (htmlFor + aria)", () => {
  it("links label to input via htmlFor/id", () => {
    render(<AuthInput label="Email" />);
    // getByLabelText falha se label não estiver linkado ao input
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("adds aria-describedby pointing to error element when error is set", () => {
    render(<AuthInput label="Email" error="Campo obrigatório" />);
    const input = screen.getByLabelText("Email");
    const describedById = input.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    const errorEl = document.getElementById(describedById!);
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent).toBe("Campo obrigatório");
  });

  it("adds aria-describedby pointing to hint element when hint is set (no error)", () => {
    render(<AuthInput label="Email" hint="Use seu e-mail corporativo" />);
    const input = screen.getByLabelText("Email");
    const describedById = input.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    const hintEl = document.getElementById(describedById!);
    expect(hintEl).toBeTruthy();
    expect(hintEl?.textContent).toBe("Use seu e-mail corporativo");
  });

  it("marks input as aria-invalid when error is present", () => {
    render(<AuthInput label="Email" error="Campo obrigatório" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when there is no error", () => {
    render(<AuthInput label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });
});
