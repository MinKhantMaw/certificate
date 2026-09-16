import { describe, expect, it } from "vitest";
import { getAlignmentGuides } from "./alignmentGuides";
import type { TemplateElement } from "../types";

const element = (overrides: Partial<TemplateElement>): TemplateElement => ({
  id: "element",
  type: "shape",
  x: 0,
  y: 0,
  width: 20,
  height: 20,
  rotation: 0,
  ...overrides,
});

describe("alignment guides", () => {
  it("matches moving edges and centers to other element bounds", () => {
    const guides = getAlignmentGuides(
      element({ id: "moving", x: 44, y: 74, width: 20, height: 20 }),
      [
        element({ id: "target", x: 54, y: 100, width: 40, height: 40 }),
      ],
    );

    expect(guides).toEqual([
      { orientation: "vertical", position: 54 },
      { orientation: "horizontal", position: 100 },
    ]);
  });

  it("ignores matches outside the tolerance and the moving element itself", () => {
    const moving = element({ id: "moving", x: 10, y: 10 });
    expect(
      getAlignmentGuides(moving, [
        moving,
        element({ id: "far-away", x: 37, y: 37 }),
      ]),
    ).toEqual([]);
  });
});