import React from "react";
import Form from "@rjsf/core";
import "./App.css";
import { schema } from "./schema";

function App() {
  const [formData, setFormData] = React.useState(null);

  const [liveValidate, setLiveValidate] = React.useState(true);

  return (
    <>
      <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#navbar"
              aria-expanded="false"
              aria-controls="navbar"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
          </div>
          <div id="navbar" className="navbar-collapse collapse">
            <ul className="nav navbar-nav">
              <li>
                <a href="#">Load Study File</a>
              </li>
              <li>
                <a href="#">Save Study File</a>
              </li>
              <li>
                <a href="#">Export for Well Ping</a>
              </li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
              <li>
                <a href="#root_studyInfo__title">→ Study Info</a>
              </li>
              <li>
                <a href="#root_streams__title">→ Streams</a>
              </li>
              <li>
                <a href="#">→ Extra Data</a>
              </li>
              <li>
                <a href="#">→ Questions Blocks</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container">
        <div className="App">
          <h1>Well Ping Study File Editor</h1>
          <p>Please use this editor on a desktop browser.</p>

          <Form
            schema={schema}
            formData={formData}
            onChange={(e) => setFormData(e.formData)}
            noHtml5Validate
            liveValidate={liveValidate}
          >
            <div
              style={{
                position: "fixed",
                right: 20,
                top: 80,
                textAlign: "right",
              }}
            >
              <div>
                <button type="submit" className="btn btn-primary">
                  Validate
                </button>
              </div>
              <div
                style={{
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    setLiveValidate(!liveValidate);
                  }}
                >
                  Live Validate {liveValidate ? "✅" : "❌"}
                </button>
                <p style={{ fontSize: 10 }}>
                  (Turn off Live Validate
                  <br />
                  if the page is slow)
                </p>
              </div>
            </div>
          </Form>

          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
    </>
  );
}

export default App;
