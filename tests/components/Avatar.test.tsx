import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

// komponentimporter
import Avatar from "@/components/Avatar"

describe("Avatar", () => {
  it("visar den första bokstaven för ett vanligt namn", () => {
    render(<Avatar name="Anna" />)

    expect(screen.getByText("A")).toBeInTheDocument()
  })

  it("visar de två första versalerna för ett PascalCase-namn", () => {
    render(<Avatar name="UserProfile" />)

    expect(screen.getByText("UP")).toBeInTheDocument()
  })

  it("renderar ingen bild eller ikon", () => {
    render(<Avatar name="Anna" />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })
})
