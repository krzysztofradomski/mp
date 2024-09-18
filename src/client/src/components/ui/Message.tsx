export const Messages = ({ messages }: { messages: string }) => {
  return <div id="messages">{messages && <div>{messages}</div>}</div>;
};
