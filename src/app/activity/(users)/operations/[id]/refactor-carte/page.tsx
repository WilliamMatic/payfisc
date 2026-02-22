import RefactorCarteClient from "./RefactorCarteClient";

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function RefactorCartePage() {
  return <RefactorCarteClient />;
}
