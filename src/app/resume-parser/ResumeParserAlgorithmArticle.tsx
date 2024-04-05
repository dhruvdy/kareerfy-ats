import { isBold } from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features";
import {
  Badge,
  Heading,
  Link,
  Paragraph,
  Table,
} from "components/documentation";
import type {
  Line,
  Lines,
  ResumeSectionToLines,
  TextItem,
  TextItems,
  TextScores,
} from "lib/parse-resume-from-pdf/types";
import { extractProfile } from "lib/parse-resume-from-pdf/extract-resume-from-sections/extract-profile";

export const ResumeParserAlgorithmArticle = ({
  textItems,
  lines,
  sections,
}: {
  textItems: TextItems;
  lines: Lines;
  sections: ResumeSectionToLines;
}) => {
  const getBadgeContent = (item: TextItem) => {
    const X1 = Math.round(item.x);
    const X2 = Math.round(item.x + item.width);
    const Y = Math.round(item.y);
    let content = `X₁=${X1} X₂=${X2} Y=${Y}`;
    if (X1 === X2) {
      content = `X=${X2} Y=${Y}`;
    }
    if (isBold(item)) {
      content = `${content} Bold`;
    }
    if (item.hasEOL) {
      content = `${content} NewLine`;
    }
    return content;
  };
  const step1TextItemsTable = [
    ["#", "Text Content", "Metadata"],
    ...textItems.map((item, idx) => [
      idx + 1,
      item.text,
      <Badge key={idx}>{getBadgeContent(item)}</Badge>,
    ]),
  ];

  const step2LinesTable = [
    ["Lines", "Line Content"],
    ...lines.map((line, idx) => [
      idx + 1,
      line.map((item, idx) => (
        <span key={idx}>
          {item.text}
          {idx !== line.length - 1 && (
            <span className="select-none font-extrabold text-sky-400">
              &nbsp;&nbsp;{"|"}&nbsp;&nbsp;
            </span>
          )}
        </span>
      )),
    ]),
  ];

  const { profile, profileScores } = extractProfile(sections);
  const Scores = ({ scores }: { scores: TextScores }) => {
    return (
      <>
        {scores
          .sort((a, b) => b.score - a.score)
          .map((item, idx) => (
            <span key={idx} className="break-all">
              <Badge>{item.score}</Badge> {item.text}
              <br />
            </span>
          ))}
      </>
    );
  };
  const step4ProfileFeatureScoresTable = [
    [
      "Resume Attribute",
      "Text (Highest Feature Score)",
      "Feature Scores of Other Texts",
    ],
    ["Name", profile.name, <Scores key={"Name"} scores={profileScores.name} />],
    [
      "Email",
      profile.email,
      <Scores key={"Email"} scores={profileScores.email} />,
    ],
    [
      "Phone",
      profile.phone,
      <Scores key={"Phone"} scores={profileScores.phone} />,
    ],
  ];

  return (
    <article className="mt-10">
      
      {/* Step 2. Group text items into lines */}
      
      {/* Step 3. Group lines into sections */}
      <Heading level={2}>Resume Sections</Heading>
     
   
      <Step3SectionsTable sections={sections} />
      {/* Step 4. Extract resume from sections */}
      <Heading level={2}>Step 4. Extract resume from sections</Heading>
      <Paragraph smallMarginTop={true}>
        Step 4 is the last step of the resume parsing process and is also the
        core of the resume parser, where it extracts resume information from the
        sections.
      </Paragraph>
      <Heading level={3}>Feature Scoring System</Heading>
      <Paragraph smallMarginTop={true}>
        The gist of the extraction engine is a feature scoring system. Each
        resume attribute to be extracted has a custom feature sets, where each
        feature set consists of a feature matching function and a feature
        matching score if matched (feature matching score can be a positive or
        negative number). To compute the final feature score of a text item for
        a particular resume attribute, it would run the text item through all
        its feature sets and sum up the matching feature scores. This process is
        carried out for all text items within the section, and the text item
        with the highest computed feature score is identified as the extracted
        resume attribute.
      </Paragraph>
      <Paragraph>
        As a demonstration, the table below shows 3 resume attributes in the
        profile section of the resume PDF added.
      </Paragraph>
      <Table table={step4ProfileFeatureScoresTable} className="mt-4" />
      {(profileScores.name.find((item) => item.text === profile.name)?.score ||
        0) > 0 && (
        <Paragraph smallMarginTop={true}>
          In the resume PDF added, the resume attribute name is likely to be "
          {profile.name}" since its feature score is{" "}
          {profileScores.name.find((item) => item.text === profile.name)?.score}
          , which is the highest feature score out of all text items in the
          profile section. (Some text items' feature scores can be negative,
          indicating they are very unlikely to be the targeted attribute)
        </Paragraph>
      )}
      <Heading level={3}>Feature Sets</Heading>
      <Paragraph smallMarginTop={true}>
        Having explained the feature scoring system, we can dive more into how
        feature sets are constructed for a resume attribute. It follows 2
        principles: <br />
        1. A resume attribute's feature sets are designed relative to all other
        resume attributes within the same section. <br />
        2. A resume attribute's feature sets are manually crafted based on its
        characteristics and likelihood of each characteristic.
      </Paragraph>
      <Paragraph>
        The table below lists some of the feature sets for the resume attribute
        name. It contains feature function that matches the name attribute with
        positive feature score and also feature function that only matches other
        resume attributes in the section with negative feature score.
      </Paragraph>
      <Table
        table={step4NameFeatureSetsTable}
        title="Name Feature Sets"
        className="mt-4"
      />
      <Heading level={3}>Core Feature Function</Heading>
      <Paragraph smallMarginTop={true}>
        Each resume attribute has multiple feature sets. They can be found in
        the source code under the extract-resume-from-sections folder and we
        won't list them all out here. Each resume attribute usually has a core
        feature function that greatly identifies them, so we will list out the
        core feature function below.
      </Paragraph>
      <Table table={step4CoreFeatureFunctionTable} className="mt-4" />
      <Heading level={3}>Special Case: Subsections</Heading>
      <Paragraph smallMarginTop={true}>
        The last thing that is worth mentioning is subsections. For profile
        section, we can directly pass all the text items to the feature scoring
        systems. But for other sections, such as education and work experience,
        we have to first divide the section into subsections since there can be
        multiple schools or work experiences in the section. The feature scoring
        system then process each subsection to retrieve each's resume attributes
        and append the results.
      </Paragraph>
      <Paragraph smallMarginTop={true}>
        The resume parser applies some heuristics to detect a subsection. The
        main heuristic to determine a subsection is to check if the vertical
        line gap between 2 lines is larger than the typical line gap * 1.4,
        since a well formatted resume usually creates a new empty line break
        before adding the next subsection. There is also a fallback heuristic if
        the main heuristic doesn't apply to check if the text item is bolded.
      </Paragraph>
      <Paragraph>
        And that is everything about the OpenResume parser algorithm :)
      </Paragraph>
      <Paragraph>
        Written by <Link href="https://github.com/xitanggg">Xitang</Link> on
        June 2023
      </Paragraph>
    </article>
  );
};

const step4NameFeatureSetsTable = [
  ["Feature Function", "Feature Matching Score"],
  ["Contains only letters, spaces or periods", "+3"],
  ["Is bolded", "+2"],
  ["Contains all uppercase letters", "+2"],
  ["Contains @", "-4 (match email)"],
  ["Contains number", "-4 (match phone)"],
  ["Contains ,", "-4 (match address)"],
  ["Contains /", "-4 (match url)"],
];

const step4CoreFeatureFunctionTable = [
  ["Resume Attribute", "Core Feature Function", "Regex"],
  ["Name", "Contains only letters, spaces or periods", "/^[a-zA-Z\\s\\.]+$/"],
  [
    "Email",
    <>
      Match email format xxx@xxx.xxx
      <br />
      xxx can be anything not space
    </>,
    "/\\S+@\\S+\\.\\S+/",
  ],
  [
    "Phone",
    <>
      Match phone format (xxx)-xxx-xxxx <br /> () and - are optional
    </>,
    "/\\(?\\d{3}\\)?[\\s-]?\\d{3}[\\s-]?\\d{4}/",
  ],
  [
    "Location",
    <>Match city and state format {"City, ST"}</>,
    "/[A-Z][a-zA-Z\\s]+, [A-Z]{2}/",
  ],
  ["Url", "Match url format xxx.xxx/xxx", "/\\S+\\.[a-z]+\\/\\S+/"],
  ["School", "Contains a school keyword, e.g. College, University, School", ""],
  ["Degree", "Contains a degree keyword, e.g. Associate, Bachelor, Master", ""],
  ["GPA", "Match GPA format x.xx", "/[0-4]\\.\\d{1,2}/"],
  [
    "Date",
    "Contains date keyword related to year, month, seasons or the word Present",
    "Year: /(?:19|20)\\d{2}/",
  ],
  [
    "Job Title",
    "Contains a job title keyword, e.g. Analyst, Engineer, Intern",
    "",
  ],
  ["Company", "Is bolded or doesn't match job title & date", ""],
  ["Project", "Is bolded or doesn't match date", ""],
];

const Step3SectionsTable = ({
  sections,
}: {
  sections: ResumeSectionToLines;
}) => {
  const table: React.ReactNode[][] = [["Lines", "Line Content"]];
  const trClassNames = [];
  let lineCounter = 0;
  const BACKGROUND_COLORS = [
    "bg-red-50",
    "bg-yellow-50",
    "bg-orange-50",
    "bg-green-50",
    "bg-blue-50",
    "bg-purple-50",
  ] as const;
  const sectionsEntries = Object.entries(sections);

  const Line = ({ line }: { line: Line }) => {
    return (
      <>
        {line.map((item, idx) => (
          <span key={idx}>
            {item.text}
            {idx !== line.length - 1 && (
              <span className="select-none font-extrabold text-sky-400">
                &nbsp;&nbsp;{"|"}&nbsp;&nbsp;
              </span>
            )}
          </span>
        ))}
      </>
    );
  };

  for (let i = 0; i < sectionsEntries.length; i++) {
    const sectionBackgroundColor = BACKGROUND_COLORS[i % 6];
    const [sectionTitle, lines] = sectionsEntries[i];
    table.push([
      sectionTitle === "profile" ? "" : lineCounter,
      sectionTitle === "profile" ? "PROFILE" : sectionTitle,
    ]);
    trClassNames.push(`${sectionBackgroundColor} font-bold`);
    lineCounter += 1;
    for (let j = 0; j < lines.length; j++) {
      table.push([lineCounter, <Line key={lineCounter} line={lines[j]} />]);
      trClassNames.push(sectionBackgroundColor);
      lineCounter += 1;
    }
  }

  return (
    <div className="mt-4 max-h-96 overflow-y-scroll border scrollbar scrollbar-track-gray-100 scrollbar-thumb-gray-200 scrollbar-w-3">
      <Table
        table={table}
        className="!border-none"
        trClassNames={trClassNames}
      />
    </div>
  );
};
