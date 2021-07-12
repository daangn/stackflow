import styled from '@emotion/styled'

const ListItem = styled.div`
  padding: 0.75rem 1rem;
  background-color: #fff;
  box-shadow: 0 1px 0 0 #f2f3f6;
  margin-bottom: 1px;
  cursor: pointer;
  transition: background-color 200ms;

  &:active {
    background-color: rgba(33, 33, 36, 0.02);
    transition: background-color 0s;
  }
`

export default ListItem
