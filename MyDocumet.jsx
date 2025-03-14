import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFViewer,
} from "@react-pdf/renderer";
import RubicFont from "./fonts/Iura6YBj_oCad4k1rzaLCr5IlLA.ttf";
import { parse } from "node-html-parser";
import { Table, TR, TH, TD } from "@ag-media/react-pdf-table";

// Register font (update with your actual font source)
Font.register({
  family: "RubicFont",
  src: RubicFont,
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 20,
    fontFamily: "RubicFont",
  },
  section: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "solid",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#fafafa",
    padding: 15,
  },
  questionSection: {
    marginBottom: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderStyle: "solid",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    borderStyle: "solid",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#555",
  },
  text: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 1.5,
    color: "#333",
  },
  image: {
    width: 300,
    height: 200,
    marginBottom: 10,
    borderRadius: 4,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  col: {
    flexDirection: "column",
  },
  colHalf: {
    width: "48%",
  },
  answerBox: {
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  choiceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    marginRight: 8,
    marginLeft: 8,
  },
  checked: {
    backgroundColor: "#000",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderStyle: "solid",
    marginVertical: 10,
  },
});

/**
 * Process HTML content and replace <span> markers with answer text.
 */
const processDefaultContent = (html, answers = {}) => {
  if (!html || typeof html !== "string") return "";
  const root = parse(html);
  const traverse = (node) => {
    if (node.nodeType === 3) {
      return node.rawText;
    }
    if (node.nodeType === 1) {
      if (
        node.tagName.toLowerCase() === "span" &&
        node.getAttribute("data-question-type")
      ) {
        const type = node.getAttribute("data-question-type");
        const id = node.getAttribute("data-id");
        const userAnswer = answers[id];
        switch (type) {
          case "blank":
            return userAnswer ? `[${userAnswer}]` : "[No Answer]";
          case "essay":
            return userAnswer
              ? `Answer: ${parse(userAnswer).text}`
              : "[No Answer]";
          case "file_upload":
            return userAnswer
              ? `[Uploaded File: ${userAnswer.split("/").pop()}]`
              : "[No File Uploaded]";
          default:
            return "[Unsupported Question Type]";
        }
      } else {
        return node.childNodes.map(traverse).join(" ");
      }
    }
    return "";
  };
  return root.childNodes.map(traverse).join(" ").trim();
};

/**
 * Render a table from HTML content using @ag-media/react-pdf-table.
 * This function parses the HTML table and maps each row and cell with explicit borders.
 */
const renderTable = (html, answers) => {
  const root = parse(html);
  // Try both "table" and "TABLE"
  const tableElement =
    root.querySelector("table") || root.querySelector("TABLE");
  if (!tableElement) return null;
  // Get rows (TR) in a case-insensitive way.
  const rows = tableElement.childNodes.filter(
    (node) => node.tagName && node.tagName.toLowerCase() === "tr"
  );
  return (
    <Table
      tdStyle={{
        padding: "4px",
        borderWidth: 1,
        borderColor: "#ddd",
        borderStyle: "solid",
      }}
      style={{
        width: "100%",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        borderStyle: "solid",
      }}
    >
      {rows.map((row, rowIndex) => {
        // Check for header cells.
        const headerCells = row.childNodes.filter(
          (node) => node.tagName && node.tagName.toLowerCase() === "th"
        );
        if (headerCells.length > 0) {
          return (
            <TH
              key={rowIndex}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderStyle: "solid",
              }}
            >
              {headerCells.map((cell, cellIndex) => {
                const cellContent = processDefaultContent(
                  cell.innerHTML,
                  answers
                );
                return (
                  <TD
                    key={cellIndex}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderStyle: "solid",
                      padding: "4px",
                    }}
                  >
                    <Text style={{ fontSize: 12, textAlign: "center" }}>
                      {cellContent || "[No Content]"}
                    </Text>
                  </TD>
                );
              })}
            </TH>
          );
        } else {
          // Otherwise, treat as data cells.
          const dataCells = row.childNodes.filter(
            (node) => node.tagName && node.tagName.toLowerCase() === "td"
          );
          return (
            <TR
              key={rowIndex}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderStyle: "solid",
              }}
            >
              {dataCells.map((cell, cellIndex) => {
                const cellContent = processDefaultContent(
                  cell.innerHTML,
                  answers
                );
                return (
                  <TD
                    key={cellIndex}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderStyle: "solid",
                      padding: "4px",
                    }}
                  >
                    <Text style={{ fontSize: 12, textAlign: "center" }}>
                      {cellContent || "[No Content]"}
                    </Text>
                  </TD>
                );
              })}
            </TR>
          );
        }
      })}
    </Table>
  );
};

// Render Multiple Choice Question (MCQ) block.
const renderMCQ = (block, userAnswer, isRTL) => {
  const root = parse(block.content);
  const choiceItems = root.querySelectorAll("ul li");
  const choices = choiceItems.map((li) => li.text.trim());
  return (
    <View>
      {choices.map((choice, index) => {
        const isChecked =
          userAnswer && Array.isArray(userAnswer) && userAnswer.includes(index);
        return (
          <View
            key={index}
            style={[
              styles.choiceItem,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={[styles.checkbox, isChecked && styles.checked]} />
            <Text
              style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
            >
              {choice}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Render Essay block with answer preview inside a bordered box.
// If the answer marker appears in a default block, we will also wrap it in a box.
const renderEssay = (block, userAnswer, isRTL) => {
  const rawAnswer =
    userAnswer && typeof userAnswer === "object"
      ? userAnswer["essay-0"] || Object.values(userAnswer).join(" ")
      : userAnswer;
  const answerText = rawAnswer
    ? processDefaultContent(rawAnswer)
    : "No answer provided";
  return (
    <View style={styles.answerBox}>
      <Text style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}>
        Answer: {answerText}
      </Text>
    </View>
  );
};

// Render Blank block with answer preview.
const renderBlank = (block, userAnswer, isRTL) => {
  const answer = userAnswer || "No answer provided";
  return (
    <Text style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}>
      [{answer}]
    </Text>
  );
};

// Media placeholders: Render a placeholder for various media types.
const renderMediaPlaceholder = (label, block) => {
  return (
    <Text style={styles.text}>
      [{label}: {block.fileName || "Unknown file"}]
    </Text>
  );
};

// Main block rendering function.
const renderBlock = (block, questionAnswers, isRTL) => {
  const blockId = block.blockId;
  const userAnswer = blockId ? questionAnswers[blockId] : null;
  switch (block.type) {
    case "default":
      if (block.content && block.content.toLowerCase().includes("<table")) {
        return renderTable(block.content, questionAnswers);
      } else if (
        block.content.toLowerCase().includes('data-question-type="essay"')
      ) {
        // Wrap default block containing an essay marker inside a bounding box.
        const processedText = processDefaultContent(
          block.content,
          questionAnswers
        );
        return (
          <View style={styles.answerBox}>
            <Text
              style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
            >
              {processedText || "[No Content]"}
            </Text>
          </View>
        );
      } else {
        const processedText = processDefaultContent(
          block.content,
          questionAnswers
        );
        return (
          <Text style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}>
            {processedText || "[No Content]"}
          </Text>
        );
      }
    case "mcq":
      return renderMCQ(block, userAnswer, isRTL);
    case "essay":
      return renderEssay(block, userAnswer, isRTL);
    case "blank":
      return renderBlank(block, userAnswer, isRTL);
    case "image":
      return renderMediaPlaceholder("Image", block);
    case "audio":
      return renderMediaPlaceholder("Audio", block);
    case "video":
      return renderMediaPlaceholder("Video", block);
    case "downloadable":
      return renderMediaPlaceholder("Downloadable File", block);
    case "file_upload":
      return renderMediaPlaceholder("Uploaded File", block);
    case "divider":
      return <View style={styles.divider} />;
    default:
      return null;
  }
};

// Main Document component. Parameters remain unchanged.
const MyDocument = ({
  profile,
  exams = [],
  CardFront,
  CardBack,
  MilitaryCardFront,
  MilitaryCardBack,
  ProfileImage,
  questions = [],
  answers = {},
  isRTL = true,
  examName = "Exam Document",
  preview = true,
}) => {
  const content = (
    <Document>
      <Page
        size="A4"
        style={[styles.page, { direction: isRTL ? "rtl" : "ltr" }]}
      >
        {/* Header with Exam Name */}
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>
            {examName}
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>
            معلومات الممتحن
          </Text>
          <View style={styles.row}>
            {ProfileImage ? (
              <View style={[styles.col, { width: "30%" }]}>
                <Text style={styles.text}>[Profile Image]</Text>
              </View>
            ) : null}
            <View
              style={[
                styles.col,
                {
                  width: ProfileImage ? "70%" : "100%",
                  justifyContent: "center",
                },
              ]}
            >
              <Text
                style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
              >
                الاسم: {profile?.username || "غير معرف"}
              </Text>
              <Text
                style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
              >
                الرقم القومي: {profile?.nationalNumber || "غير معرف"}
              </Text>
              <Text
                style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
              >
                رقم المستخدم: {profile?.id || "غير معرف"}
              </Text>
              <Text
                style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
              >
                نوع الحساب: {profile?.MilitaryNumber ? "عسكري" : "مدني"}
              </Text>
              <Text
                style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
              >
                الرقم العسكري: {profile?.MilitaryNumber || "غير معرف"}
              </Text>
              <Text
                style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
              >
                السلاح المكلف به: {profile?.AssignedWeapon || "غير معرف"}
              </Text>
            </View>
          </View>
        </View>

        {/* National ID Cards Section */}
        {(CardFront || CardBack) && (
          <View style={styles.section}>
            <Text
              style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            >
              صورة البطاقة الشخصية
            </Text>
            <View style={styles.row}>
              {CardFront && (
                <View style={styles.colHalf}>
                  <Text style={styles.text}>[Card Front]</Text>
                </View>
              )}
              {CardBack && (
                <View style={styles.colHalf}>
                  <Text style={styles.text}>[Card Back]</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Military Card Section */}
        {(MilitaryCardFront || MilitaryCardBack) && (
          <View style={styles.section}>
            <Text
              style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            >
              صورة البطاقة العسكرية
            </Text>
            <View style={styles.row}>
              {MilitaryCardFront && (
                <View style={styles.colHalf}>
                  <Text style={styles.text}>[Military Card Front]</Text>
                </View>
              )}
              {MilitaryCardBack && (
                <View style={styles.colHalf}>
                  <Text style={styles.text}>[Military Card Back]</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Exams Results Section */}
        {exams.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            >
              Exam Results
            </Text>
            {exams.map((exam, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <Text
                  style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
                >
                  Exam: {exam.name}
                </Text>
                <Text
                  style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
                >
                  Score: {exam.score}
                </Text>
                <Text
                  style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
                >
                  Rank: {exam.rank}
                </Text>
                <Text
                  style={[styles.text, { textAlign: isRTL ? "right" : "left" }]}
                >
                  Description: {exam.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Questions and Answers Section */}
        {questions.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
            >
              الأسئلة والإجابات
            </Text>
            {questions.map((question, qIndex) => (
              <View key={qIndex} style={styles.questionSection}>
                <Text
                  style={[
                    styles.subtitle,
                    { textAlign: question.isRTL ?? isRTL ? "right" : "left" },
                  ]}
                >
                  Question {qIndex + 1}
                </Text>
                {question.processed_content &&
                  question.processed_content.map((block, bIndex) => (
                    <View key={bIndex}>
                      {renderBlock(
                        block,
                        answers[qIndex] || {},
                        question.isRTL ?? isRTL
                      )}
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );

  if (preview) {
    return (
      <PDFViewer style={{ width: "100%", height: "100vh" }}>
        {content}
      </PDFViewer>
    );
  }
  return content;
};

export default MyDocument;
