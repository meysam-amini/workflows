import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Welcome } from './Welcome.tsx'
import { UserCard } from './UserCard.tsx'
import { CardView } from './CardView.tsx'
import { Greeting } from './Greeting.tsx'
import { DynamicListExample } from './DynamicListExample.tsx'
import { MultipleInputsForm } from './MultipleInputsForm.tsx'
import { FormSubmission } from './FormSubmission.tsx'



function App() {

  return (

    <>

      <Greeting isLoggedIn={true} />
      _____________________________________
      <br />
      <h2>Children Probs Example:</h2>
      <CardView>
        <p>start children</p>
        <Welcome name='user123' />
        <p>end children</p>
      </CardView>
      <br />
      <h2>conditional Rendering Example:</h2>
      <UserCard name='user123' role='admin' verified={true} />
      <br />
      _____________________________________
      <h2>Dynamic List Example:</h2>
      <DynamicListExample />
      <br />
      _____________________________________
      <h2>Multiple Input Form Example:</h2>
      <MultipleInputsForm />

      <br />
      _____________________________________
      <h2>Form Submission Example:</h2>
      <FormSubmission />
    </>
  )






}
export default App
