import React from "react";
import Form from "@rjsf/core";
import { JSONSchema7 } from "json-schema";
import "./App.css";

function App() {
  const schema: JSONSchema7 = {
    title: "Test form",
    type: "string",
  };

  return (
    <div className="App">
      <Form schema={schema} />
    </div>
  );
}

export default App;
