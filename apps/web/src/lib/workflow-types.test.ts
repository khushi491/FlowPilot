import { validateWorkflowDefinition } from "./workflow-types";

describe("validateWorkflowDefinition", () => {
  it("requires at least one node", () => {
    const errors = validateWorkflowDefinition({ nodes: [], edges: [] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("flags missing required fields", () => {
    const errors = validateWorkflowDefinition({
      nodes: [
        {
          id: "llm-1",
          type: "llm",
          data: { label: "Prompt", type: "llm", config: { prompt: "" } },
        },
      ],
      edges: [],
    });
    expect(errors.some((e) => e.includes("prompt"))).toBe(true);
  });

  it("accepts a valid minimal graph", () => {
    const errors = validateWorkflowDefinition({
      nodes: [
        {
          id: "llm-1",
          type: "llm",
          data: { label: "Prompt", type: "llm", config: { prompt: "Hello" } },
        },
        {
          id: "out-1",
          type: "output",
          data: { label: "Output", type: "output", config: { key: "result" } },
        },
      ],
      edges: [{ id: "e1", source: "llm-1", target: "out-1" }],
    });
    expect(errors).toEqual([]);
  });
});
