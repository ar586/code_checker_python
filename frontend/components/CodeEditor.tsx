"use client";

import dynamic from "next/dynamic";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const customTheme = EditorView.theme({
  "&": {
    backgroundColor: "#0d1424",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#3b82f6",
    minHeight: "300px",
  },
  ".cm-cursor": {
    borderLeftColor: "#3b82f6",
    borderLeftWidth: "2px",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#1e3a5f !important",
  },
  ".cm-focused .cm-selectionBackground": {
    backgroundColor: "#1e3a5f !important",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "#131c35",
  },
  ".cm-gutters": {
    backgroundColor: "#0a0e1a",
    color: "#334155",
    border: "none",
    borderRight: "1px solid #1e2d50",
    paddingRight: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#0f1629",
    color: "#60a5fa",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    paddingLeft: "16px",
  },
});

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[python(), customTheme]}
        theme={oneDark}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: false,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        style={{
          height: "100%",
          fontSize: "14px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      />
    </div>
  );
}
