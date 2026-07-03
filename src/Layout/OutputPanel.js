import ResultPanel from "./ResultPanel";

const OutputPanel = ({ result, loading, level, code, language, showFlowchart,
  flowchartData, flowchartLoading, switchToFlowchart, onHighlightLine }) => {
  return (
    <ResultPanel
      result={result}
      loading={loading}
      level={level}
      code={code}
      language={language}
      showFlowchart={showFlowchart}
      flowchartData={flowchartData}
      flowchartLoading={flowchartLoading}
      switchToFlowchart={switchToFlowchart}
      onHighlightLine={onHighlightLine}
    />
  );
};

export default OutputPanel;
