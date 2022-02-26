import fs from "fs";
import { TSDocParser, DocExcerpt } from "@microsoft/tsdoc";

/**
 * This is a simplistic solution until we implement proper DocNode rendering APIs.
 */
export class Formatter {
  static renderDocNode(docNode) {
    let result = "";
    if (docNode) {
      if (docNode instanceof DocExcerpt) {
        result += docNode.content.toString();
      }
      for (const childNode of docNode.getChildNodes()) {
        result += Formatter.renderDocNode(childNode);
      }
    }
    return result;
  }

  static renderDocNodes(docNodes) {
    let result = "";
    for (const docNode of docNodes) {
      result += Formatter.renderDocNode(docNode);
    }
    return result;
  }
}

const tsdocParser = new TSDocParser();

const json = JSON.parse(
  fs.readFileSync(`${process.cwd()}/temp/sdk.api.json`, "utf8"),
);

function languageNameToKey(languageName) {
  switch (languageName) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "tyepscript";
    default:
      return languageName;
  }
}

const modules = json.members[0].members.filter(
  (m) =>
    m.kind === "Class" &&
    m.members
      .filter((cMember) => cMember.kind === "Property")
      .findIndex((property) => property.name === "contractType") > -1,
);

function parseExampleTag(docComment) {
  const exampleBlocks = docComment._customBlocks.filter(
    (b) => b._blockTag._tagName === "@example",
  );

  const examplesString = Formatter.renderDocNodes(exampleBlocks);

  const regex = /```([a-zA-Z]*)\n([\S\s]*?)\n```/g;

  let matches;

  const examples = {};

  while ((matches = regex.exec(examplesString)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    examples[languageNameToKey(matches[1])] = matches[2];
  }
  return examples;
}

const parseSignature = (m) => {
  console.log(m.excerptTokens)
  return m.excerptTokens
    ? m.excerptTokens.map((t) => {
        if(t.kind === 'Reference') {
          return `[${t.text}](https://typescript-docs.thirdweb.com/sdk.${t.text.toLowerCase()})`
        }
        return t.text
      }).join("")
    : undefined;
};

const parseMembers = (members = [], kind = "Method") => {
  const validMembers = members.filter((m) => m.kind === kind);
  return validMembers
    .map((m) => {
      const parserContext = tsdocParser.parseString(m.docComment);
      const docComment = parserContext.docComment;
      const examples = parseExampleTag(docComment);
      if (Object.keys(examples).length > 0) {
        return {
          name: m.name,
          summary: Formatter.renderDocNode(docComment.summarySection),
          remarks: docComment.remarksBlock
            ? Formatter.renderDocNode(docComment.remarksBlock.content)
            : null,
          examples,
          signature: parseSignature(m),
        };
      }
      return null;
    })
    .filter((m) => !!m);
};

const moduleMap = modules.slice(0,1).reduce((acc, m) => {
  const parserContext = tsdocParser.parseString(m.docComment);
  const docComment = parserContext.docComment;
  const examples = parseExampleTag(docComment);

  if (Object.keys(examples).length > 0) {
    acc[m.name] = {
      name: m.name,
      summary: Formatter.renderDocNode(docComment.summarySection),
      remarks: docComment.remarksBlock
        ? Formatter.renderDocNode(docComment.remarksBlock.content)
        : null,
      examples,
      methods: parseMembers(m.members, "Method"),
      properties: parseMembers(m.members, "Property"),
      signature: parseSignature(m),
    };
  }

  return acc;
}, {});

fs.writeFileSync(
  `${process.cwd()}/docs/snippets.json`,
  JSON.stringify(moduleMap, null, 2),
);
