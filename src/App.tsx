import React from "react";
import Form from "@rjsf/core";
import "./App.css";
import { schema } from "./schema";

function App() {
  const [formData, setFormData] = React.useState(null);

  return (
    <div className="App">
      <Form
        schema={schema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        noHtml5Validate
      />

      <pre>{JSON.stringify(formData, null, 2)}</pre>
    </div>
  );
}

export default App;
