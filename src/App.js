import { useState } from 'react'
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form'
import './App.css'

const { REACT_APP_NETWORK_PROVIDER, REACT_APP_NETWORK } = process.env

const stdlib = loadStdlib(REACT_APP_NETWORK)
stdlib.setProviderByName(REACT_APP_NETWORK_PROVIDER)
if (REACT_APP_NETWORK === 'ALGO') {
  stdlib.setSignStrategy('mnemonic')
}

const hasFaucet = true
  && REACT_APP_NETWORK === 'ETH'
  && REACT_APP_NETWORK_PROVIDER === 'LocalHost'

function App() {
  const [state, setState] = useState({
    acc: null
  })
  const [query, setQuery] = useState({})
  const handleChange = ({ target }) => {
    let { name, value } = target
    switch (name) {
      case 'INFO':
      case 'PASS':
      case 'AMT':
        value = parseInt(value)
        break
      default:
        break
    }
    setQuery({ ...query, [name]: value })
  }

  const handleConnect = async () => {
    console.log("Connecting ...")
    const acc = await stdlib.getDefaultAccount()
    const addr = stdlib.formatAddress(await acc.getAddress())
    const balAtomic = await stdlib.balanceOf(acc)
    const bal = stdlib.formatCurrency(balAtomic, 4)
    setState({
      ...state,
      acc,
      addr,
      balAtomic,
      bal
    })
  }

  const handleFaucet = async () => {
    console.log("Faucet ...")
    const faucet = await stdlib.getFaucet()
    await stdlib.transfer(
      faucet,
      await stdlib.getDefaultAccount(),
      stdlib.parseCurrency('100')
    )
  }

  const handleAlice = async () => {
    console.log("Handling alice ...")
    const ctc = state.acc.deploy(backend)
    setState({ ...state, ctc })
    await backend.Alice(ctc, {
      amt: stdlib.parseCurrency(query.AMT),
      pass: query.PASS
    })
  }

  const handleBob = async () => {
    console.log("Handling bob ...")
    let { INFO, PASS } = query
    const ctc = state.acc.attach(backend, parseInt(INFO))
    await backend.Bob(ctc, {
      getPass: () => {
        console.log(`Bob asked to give the preimage`);
        console.log(`Returning: ${PASS}`);
        return PASS
      }
    })
  }

  return (
    <Container>
      <Row className="mt-5">
        <Col>
          <h1 className="text-center">HashLock</h1>
        </Col>
        <Col className="text-center" xs={12}>
          This runs on the <a href="https://testnet.algoexplorer.io/">Algorand Test Net</a>. Need funds? Try <a href="https://bank.testnet.algorand.network/">Algorand dispenser</a>. Explore more <a href="https://temptemp3.github.io/dapps/">dapps</a>.
        </Col>
      </Row>
      <Row className="mt-5 role role-participant">
        <ButtonGroup as={Col} xs={2} size="lg">
          {!state.acc && <Button onClick={handleConnect}>Connect</Button>}
          {hasFaucet && <Button variant="secondary" onClick={handleFaucet}>Faucet</Button>}
        </ButtonGroup>
      </Row>
      {state.acc && <Row>
        {[
          'addr',
          'bal'
        ].map(name =>
          <Col xs={12}>{name}: {state[name]}</Col>
        )}
      </Row>}
      {[
        {
          name: "alice",
          title: "Send funds",
          controls: [
            { col: {}, control: { name: "AMT", placeholder: "Amount" } },
            { col: { xs: 6 }, control: { name: "PASS", type: "number", placeholder: "Secret number" } }
          ],
          buttonLabel: "Send",
          buttonProps: {
            onClick: handleAlice,
            disabled: !state.acc
          }
        },
        {
          name: "bob",
          title: "Receive funds",
          controls: [
            {
              col: {},
              control: {
                name: REACT_APP_NETWORK === 'ETH' ? "ADDR" : "INFO",
                type: REACT_APP_NETWORK === 'ETH' ? "text" : "number",
                placeholder: "Info",
              }
            },
            { col: { xs: 6 }, control: { name: "PASS", type: "number", placeholder: "Secret number" } }
          ],
          buttonLabel: "Receive",
          buttonProps: {
            onClick: handleBob,
            disabled: !state.acc
          }
        }
      ].map(role =>
        <Row className={`mt-5 role ${role.name}`}>
          <Col xs={12} className="mb-3">
            <h2>
              {role.title}
            </h2>
          </Col>
          {role.controls.map(el =>
            <Col xs={3} {...el.col}>
              <Form.Control className="mb-3" size="lg" type="text" onChange={handleChange} {...el.control} />
            </Col>
          )}
          <Col xs={3}>
            <Button size="lg" {...role.buttonProps}>{role.buttonLabel}</Button>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default App;
