import React from "react";
import Form from "@rjsf/core";
import "./App.css";
import { schema } from "./schema";

const validateButtonID = "button-validate";
const validateAndSaveButtonID = "button-save";
const validateAndExportButtonID = "button-export";

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
                <a href="#root_studyInfo">→ Study Info</a>
              </li>
              <li>
                <a href="#root_streams">→ Streams</a>
              </li>
              <li>
                <a href="#root_extraData">→ Extra Data</a>
              </li>
              <li>
                <a href="#">→ Questions Blocks</a>
              </li>
              <li>
                <a href="#study-file-json">→ JSON</a>
              </li>
            </ul>
            {/*<ul className="nav navbar-nav navbar-right">
            </ul>*/}
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
            {/* Notice that we cannot programmitcally trigger validate now: https://github.com/rjsf-team/react-jsonschema-form/issues/246 */}
            <div id="right-toolbar">
              <div className="right-button">
                <button
                  type="submit"
                  id={validateButtonID}
                  className="btn btn-primary"
                >
                  Validate
                </button>
              </div>
              <div className="right-button">
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
              <div style={{ marginTop: 30 }}></div>
              <div className="right-button">
                <button type="button" className="btn">
                  Load File
                </button>
              </div>
              <div className="right-button">
                <button
                  type="submit"
                  id={validateAndSaveButtonID}
                  className="btn btn-success"
                >
                  Validate and
                  <br />
                  Save File
                </button>
              </div>
              <div className="right-button">
                <button
                  type="submit"
                  id={validateAndExportButtonID}
                  className="btn btn-danger"
                >
                  Validate and
                  <br />
                  Export for
                  <br />
                  Well Ping
                </button>
              </div>
            </div>
          </Form>

          <div style={{ marginTop: 30 }}>
            <h2>Form JSON</h2>
            <pre id="study-file-json">{JSON.stringify(formData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
