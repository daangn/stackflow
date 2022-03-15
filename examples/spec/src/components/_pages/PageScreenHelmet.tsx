import React, { useState } from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet } from '@karrotframe/navigator'

const PageScreenHelmet: React.FC = () => {
  const [appendLeft, setAppendLeft] = useState('')
  const [appendRight, setAppendRight] = useState('')

  const [isTopClicked, setIsTopClicked] = useState(false)
  const [isRightClicked, setIsRightClicked] = useState(false)

  const [noBorder, setNoBorder] = useState(false)
  const [noScreenHelmet, setNoScreenHelmet] = useState(false)

  const [visible, setVisible] = useState(true)
  const [shouldPreventSwipeBack, setPreventSwipeBack] = useState(false)

  const [isNoBackButton, setNoBackButton] = useState(false)

  const onTopClick = () => {
    setIsTopClicked(true)
  }

  const onRightClick = () => {
    setIsRightClicked(true)
  }

  return (
    <Container>
      {!noScreenHelmet && (
        <ScreenHelmet
          title="ScreenHelmet"
          onTopClick={onTopClick}
          appendLeft={appendLeft}
          appendRight={<div onClick={onRightClick}>{appendRight}</div>}
          noBorder={noBorder}
          visible={visible}
          preventSwipeBack={shouldPreventSwipeBack}
          noBackButton={isNoBackButton}
        />
      )}
      <InputGroup>
        <InputLabel>UNMOUNT SCREEN HELMET</InputLabel>
        <Checkbox
          type="checkbox"
          checked={noScreenHelmet}
          onChange={(e) => {
            setNoScreenHelmet(e.target.checked)
          }}
        />
      </InputGroup>
      <InputGroup>
        <InputLabel>APPEND LEFT</InputLabel>
        <Input
          type="text"
          value={appendLeft}
          onChange={(e) => {
            setAppendLeft(e.target.value)
          }}
        />
      </InputGroup>
      <InputGroup>
        <InputLabel>APPEND RIGHT</InputLabel>
        <Input
          type="text"
          value={appendRight}
          onChange={(e) => {
            setAppendRight(e.target.value)
          }}
        />
      </InputGroup>
      <InputGroup>
        <InputLabel>IS TOP CLICKED</InputLabel>
        <Boolean>{String(isTopClicked)}</Boolean>
      </InputGroup>
      <InputGroup>
        <InputLabel>IS RIGHT CLICKED</InputLabel>
        <Boolean>{String(isRightClicked)}</Boolean>
      </InputGroup>
      <InputGroup>
        <InputLabel>NO BORDER</InputLabel>
        <Checkbox
          type="checkbox"
          checked={noBorder}
          onChange={(e) => {
            setNoBorder(e.target.checked)
          }}
        />
      </InputGroup>
      <InputGroup>
        <InputLabel>VISIBILITY FOR NAVBAR</InputLabel>
        <Checkbox
          type="checkbox"
          checked={visible}
          onChange={(e) => {
            setVisible(e.target.checked)
          }}
        />
      </InputGroup>
      <InputGroup>
        <InputLabel>PREVENT SWIPE TO GO BACK</InputLabel>
        <Checkbox
          type="checkbox"
          checked={shouldPreventSwipeBack}
          onChange={(e) => {
            setPreventSwipeBack(e.target.checked)
          }}
        />
      </InputGroup>
      <InputGroup>
        <InputLabel>HIDE BACK BUTTON</InputLabel>
        <Checkbox
          type="checkbox"
          checked={isNoBackButton}
          onChange={(e) => {
            setNoBackButton(e.target.checked)
          }}
        />
      </InputGroup>
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

const InputGroup = styled.div`
  margin-bottom: 1rem;
`

const InputLabel = styled.div`
  font-size: 0.75rem;
  color: #4d5159;
  margin-bottom: 0.25rem;
`

const Input = styled.input`
  padding: 0.5rem;
  display: block;
  width: 100%;
  box-sizing: border-box;
  appearance: none;
  font-size: 1rem;
  border: 0;
  box-shadow: 0 0 0 1px #d1d3d8;
  border-radius: 0.25rem;
`

const Checkbox = styled.input``

const Boolean = styled.div``

export default PageScreenHelmet
