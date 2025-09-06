const test = () => {
  const selectedSession = { answers: [{ description: 'test', line_data: { answer_value: 'yes', category: 'test' } }] };
  
  return (
    <div>
      {selectedSession.answers && selectedSession.answers.length > 0 ? (
        selectedSession.answers.map((answer, index) => (
          <div key={index}>
            <p>{answer.description}</p>
            <span>{answer.line_data?.answer_value || 'Unknown'}</span>
            <span>{answer.line_data?.category || 'General'}</span>
          </div>
        ))
      ) : (
        <div>
          <p>No answers recorded yet</p>
        </div>
      )}
    </div>
  );
}