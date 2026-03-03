import { describe, expect, it } from "vitest";
import { parseSkillDocument } from "../../../src/application/core/skills/skillFrontmatter.js";

describe("parseSkillDocument", () => {
  it("parses valid skill frontmatter", () => {
    const doc = parseSkillDocument(
      `---
name: test-skill
title: Test Skill
description: Sample
category: security
applies_to: any,node
modes: quick,deep
priority: 10
---
## Checks
- one
`,
      "test.SKILL.md"
    );

    expect(doc.meta.name).toBe("test-skill");
    expect(doc.meta.appliesTo).toEqual(["any", "node"]);
    expect(doc.meta.modes).toEqual(["quick", "deep"]);
  });

  it("throws when required field is missing", () => {
    expect(() =>
      parseSkillDocument(
        `---
name: test-skill
title: Test Skill
description: Sample
category: security
applies_to: any,node
modes: quick,deep
---
body
`,
        "invalid.SKILL.md"
      )
    ).toThrow(/priority/i);
  });

  it("throws on invalid name", () => {
    expect(() =>
      parseSkillDocument(
        `---
name: ../oops
title: Test Skill
description: Sample
category: security
applies_to: any,node
modes: quick,deep
priority: 4
---
body
`,
        "invalid.SKILL.md"
      )
    ).toThrow(/name/i);
  });
});

