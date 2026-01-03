import { getMetadata } from '../demos/demoList'

export const ExampleCard = ({ demoName }: { demoName: string }) => {
  const demo = getMetadata(demoName)
  return (
    <div className="demo-info">
      <h2>{demo.title}</h2>
      <p>{demo.description}</p>
    </div>
  )
}
