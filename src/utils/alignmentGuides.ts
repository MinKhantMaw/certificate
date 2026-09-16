import { TemplateElement } from "../types";

export type AlignmentGuide =
  | { orientation: "vertical"; position: number }
  | { orientation: "horizontal"; position: number };

const SNAP_DISTANCE = 6;

function closestMatch(value: number, candidates: number[]) {
  return candidates
    .map((candidate) => ({ candidate, distance: Math.abs(value - candidate) }))
    .filter(({ distance }) => distance <= SNAP_DISTANCE)
    .sort((left, right) => left.distance - right.distance)[0]?.candidate;
}

export function getAlignmentGuides(
  moving: Pick<TemplateElement, "id" | "x" | "y" | "width" | "height">,
  others: TemplateElement[],
): AlignmentGuide[] {
  const movingX = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const movingY = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];
  const verticalTargets: number[] = [];
  const horizontalTargets: number[] = [];

  for (const element of others) {
    if (element.id === moving.id) continue;
    verticalTargets.push(element.x, element.x + element.width / 2, element.x + element.width);
    horizontalTargets.push(element.y, element.y + element.height / 2, element.y + element.height);
  }

  const guides: AlignmentGuide[] = [];
  const verticalPosition = movingX
    .map((value) => closestMatch(value, verticalTargets))
    .find((position): position is number => position !== undefined);
  const horizontalPosition = movingY
    .map((value) => closestMatch(value, horizontalTargets))
    .find((position): position is number => position !== undefined);

  if (verticalPosition !== undefined)
    guides.push({ orientation: "vertical", position: verticalPosition });
  if (horizontalPosition !== undefined)
    guides.push({ orientation: "horizontal", position: horizontalPosition });
  return guides;
}