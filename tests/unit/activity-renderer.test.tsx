// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ActivityRenderer,
  ChildSurfaceContext,
  ChildViewContext,
} from "@/components/session/ActivityRenderer";
import type { SessionActivity, SessionAudio } from "@/lib/programme/session-view";

/**
 * The child-facing screen patterns of the September visual upgrade
 * (docs/september-illustration-upgrade-plan.md): a picture sits on a stage, a recording is
 * offered only when it exists and never plays by itself, the child's surface grows pictures, and
 * motion is decoration a screen reader never hears.
 */

const picture = (id: string, alt: string, tag: string) => ({
  id,
  url: `/media/objects/${id}.svg`,
  alt,
  tags: [tag],
});

const recording: SessionAudio = {
  id: "mot-la-main",
  url: "/audio/mots/la-main.mp3",
  transcript: "la main",
  seconds: 2,
};

const base: SessionActivity = {
  id: "t-a1",
  position: 1,
  title: "Les mots de mon corps",
  childInstruction: "Écoute, puis dis le mot avec moi : la main, le pied.",
  adultGuidance: "Montrez la chose vraie si vous l’avez, sinon l’image.",
  minutes: 5,
  role: "teach",
  mode: "off-screen",
  renderer: "word-cards",
  type: "vocabulary",
  vocabulary: [
    { fr: "la main", en: "the hand", audio: null },
    { fr: "le pied", en: "the foot", audio: null },
  ],
  englishHelp: null,
  payload: {},
  text: null,
  media: [
    picture("corps-main", "Une main ouverte", "main"),
    picture("corps-pied", "Un pied", "pied"),
  ],
};

describe("word cards", () => {
  it("puts every picture on a stage, with its word under it", () => {
    const { container } = render(<ActivityRenderer activity={base} />);
    expect(container.querySelectorAll(".teka-stage").length).toBe(2);
    expect(screen.getByText("la main")).toBeTruthy();
    expect(screen.getByText("le pied")).toBeTruthy();
    expect(screen.getByAltText("Une main ouverte")).toBeTruthy();
  });

  it("offers no listen control while nobody has recorded the word", () => {
    render(<ActivityRenderer activity={base} />);
    expect(screen.queryByRole("button", { name: /Écouter/ })).toBeNull();
    expect(document.querySelector("audio")).toBeNull();
  });

  it("offers a listen control for a recorded word, and never autoplays it", () => {
    const withAudio: SessionActivity = {
      ...base,
      vocabulary: [
        { fr: "la main", en: "the hand", audio: recording },
        { fr: "le pied", en: "the foot", audio: null },
      ],
    };
    render(<ActivityRenderer activity={withAudio} />);
    const listen = screen.getAllByRole("button", { name: /Écouter/ });
    expect(listen.length).toBe(1);
    expect(listen[0]!.textContent).toContain("la main");
    const audio = document.querySelector("audio")!;
    expect(audio.getAttribute("src")).toBe("/audio/mots/la-main.mp3");
    expect(audio.hasAttribute("autoplay")).toBe(false);
    expect(audio.hasAttribute("loop")).toBe(false);
    expect(audio.getAttribute("preload")).toBe("none");
  });

  it("keeps the naming game", () => {
    render(<ActivityRenderer activity={base} />);
    fireEvent.click(screen.getByRole("button", { name: "Jouer : je montre le mot" }));
    expect(screen.getByText(/^Trouve l’image pour/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Revoir les mots" }));
    expect(screen.getByText("la main")).toBeTruthy();
  });

  it("renders a text-only vocabulary entry intentionally, without an empty picture stage", () => {
    const { container } = render(
      <ActivityRenderer
        activity={{
          ...base,
          vocabulary: [...base.vocabulary, { fr: "il sert à", en: "it is used to", audio: null }],
        }}
      />,
    );
    expect(container.querySelectorAll(".teka-stage")).toHaveLength(2);
    expect(screen.getByText("il sert à").closest("li")?.querySelector(".teka-stage")).toBeNull();
  });

  it("grows the pictures on the child's own surface", () => {
    const parent = render(<ActivityRenderer activity={base} />);
    const parentClass = parent.getByAltText("Une main ouverte").className;
    parent.unmount();
    render(
      <ChildViewContext.Provider value={true}>
        <ActivityRenderer activity={base} />
      </ChildViewContext.Provider>,
    );
    const childClass = screen.getByAltText("Une main ouverte").className;
    expect(childClass).not.toBe(parentClass);
    expect(childClass).toMatch(/max-w-44/);
  });
});

describe("a rhyme", () => {
  const rhyme: SessionActivity = {
    ...base,
    id: "t-a2",
    title: "Ma comptine",
    childInstruction: "Dis la comptine avec moi, et fais les gestes.",
    renderer: "audio-narrative",
    type: "song-rhyme",
    vocabulary: [],
    media: [],
    payload: { textId: "comptine-un-deux-trois-mains" },
    text: {
      title: "Un, deux, trois, mes mains",
      kind: "rhyme",
      lines: [
        "Un, deux, trois,",
        "mes mains sont là.",
        "Un, deux, trois,",
        "je les cache… les voilà !",
      ],
      illustration: picture("comptine-mains", "Deux mains levées", "mains"),
      audio: null,
    },
  };

  it("shows the picture on a stage and every line on one page, in sequence", () => {
    const { container } = render(<ActivityRenderer activity={rhyme} />);
    expect(container.querySelector(".teka-stage img")?.getAttribute("alt")).toBe(
      "Deux mains levées",
    );
    const lines = container.querySelectorAll("p.teka-stagger");
    expect(lines.length).toBe(4);
    expect(lines[3]!.textContent).toBe("je les cache… les voilà !");
    expect(screen.queryByRole("button", { name: "Page suivante" })).toBeNull();
  });

  it("offers the recording only when it exists, labelled as the rhyme", () => {
    render(<ActivityRenderer activity={rhyme} />);
    expect(screen.queryByRole("button", { name: /Écouter/ })).toBeNull();
    render(
      <ActivityRenderer activity={{ ...rhyme, text: { ...rhyme.text!, audio: recording } }} />,
    );
    expect(screen.getByRole("button", { name: "Écouter la comptine" })).toBeTruthy();
  });

  it("turns a story three lines at a time, and the page rises once", () => {
    const story: SessionActivity = {
      ...rhyme,
      type: "listening-story",
      text: {
        ...rhyme.text!,
        kind: "story",
        lines: ["Un", "deux", "trois", "quatre", "cinq"],
      },
    };
    const { container } = render(<ActivityRenderer activity={story} />);
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(container.querySelectorAll("p.teka-stagger").length).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(screen.getByText("2 / 2")).toBeTruthy();
    expect(screen.getByText("cinq")).toBeTruthy();
    expect(container.querySelector(".teka-rise")).not.toBeNull();
  });
});

describe("the screen stepping back", () => {
  it("says so in one line when there is nothing to show, with no empty frame", () => {
    const move: SessionActivity = {
      ...base,
      renderer: "move",
      type: "movement",
      vocabulary: [],
      media: [],
      payload: { moves: ["Marche", "Cours", "Stop"] },
    };
    const { container } = render(<ActivityRenderer activity={move} />);
    expect(screen.getByText(/Posez l’écran/)).toBeTruthy();
    expect(container.querySelectorAll("li.teka-stagger").length).toBe(3);
    expect(container.querySelector(".border-dashed")).toBeNull();
  });

  it("gives a media-free observation an explicit off-screen handoff", () => {
    render(
      <ActivityRenderer
        activity={{
          ...base,
          renderer: "look-and-name",
          type: "observation",
          vocabulary: [],
          media: [],
          payload: { focus: "les articulations en action" },
        }}
      />,
    );
    expect(screen.getByText(/Posez l’écran/)).toBeTruthy();
    expect(screen.getByText(/les articulations en action/)).toBeTruthy();
  });
});

describe("the child's own screen", () => {
  it("makes an off-screen activity's one line the whole screen, not a caption", () => {
    const move: SessionActivity = {
      ...base,
      renderer: "oral-exchange",
      type: "conversation",
      vocabulary: [],
      media: [],
      payload: {},
    };
    render(
      <ChildViewContext.Provider value={true}>
        <ActivityRenderer activity={move} />
      </ChildViewContext.Provider>,
    );
    expect(screen.getByText(/Posez l’écran/).className).toMatch(/text-center/);
  });

  it("centres the word cards and lets them grow", () => {
    const { container } = render(
      <ChildViewContext.Provider value={true}>
        <ActivityRenderer activity={base} />
      </ChildViewContext.Provider>,
    );
    expect(container.querySelector('ul[aria-label="Les mots"]')?.className).toMatch(
      /justify-center/,
    );
  });
});

describe("which picture leads a text", () => {
  const rain = picture("histoire-pluie", "La pluie qui tombe sur le toit", "pluie");
  const hand = picture("comptine-compter", "Une main qui montre trois doigts", "compter");
  const rhymeOverTask: SessionActivity = {
    ...base,
    id: "t-rain",
    title: "Le bruit de la pluie",
    renderer: "audio-narrative",
    type: "song-rhyme",
    vocabulary: [],
    media: [rain],
    payload: { textId: "un-deux-trois-je-compte" },
    text: {
      title: "Un, deux, trois, je compte",
      kind: "rhyme",
      lines: ["Un, deux, trois,"],
      illustration: hand,
      audio: null,
    },
  };

  it("shows the task's own picture when a rhyme is said over another task", () => {
    render(<ActivityRenderer activity={rhymeOverTask} />);
    expect(screen.getByAltText("La pluie qui tombe sur le toit")).toBeTruthy();
    expect(screen.queryByAltText("Une main qui montre trois doigts")).toBeNull();
  });

  it("keeps the story's own scene on a story, even when the activity names pictures", () => {
    const story: SessionActivity = {
      ...rhymeOverTask,
      type: "listening-story",
      text: { ...rhymeOverTask.text!, kind: "story" },
    };
    render(<ActivityRenderer activity={story} />);
    expect(screen.getByAltText("Une main qui montre trois doigts")).toBeTruthy();
    expect(screen.queryByAltText("La pluie qui tombe sur le toit")).toBeNull();
  });
});

describe("counting again", () => {
  const counting: SessionActivity = {
    ...base,
    renderer: "quantity",
    type: "counting",
    vocabulary: [],
    media: [],
    payload: { upTo: 20 },
  };

  it("on the child's surface, brings the instruction back after Recommencer", () => {
    const showInstruction = vi.fn();
    render(
      <ChildViewContext.Provider value={true}>
        <ChildSurfaceContext.Provider value={showInstruction}>
          <ActivityRenderer activity={counting} />
        </ChildSurfaceContext.Provider>
      </ChildViewContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Objet 12" }));
    expect(screen.getByRole("status").textContent).toBe("12");
    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    expect(screen.getByRole("status").textContent).toBe("…");
    expect(screen.queryByRole("button", { name: "Recommencer" })).toBeNull();
    expect(showInstruction).toHaveBeenCalledTimes(1);
  });

  it("in the parent's guide, only resets the count", () => {
    render(<ActivityRenderer activity={counting} />);
    fireEvent.click(screen.getByRole("button", { name: "Objet 20" }));
    expect(screen.getByRole("status").textContent).toBe("20 en tout. Bravo !");
    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    expect(screen.getByRole("status").textContent).toBe("…");
  });
});
