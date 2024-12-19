import React from 'react'
import Header from '../header'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../state'
import { configSelectors } from '../../state/config'

const mapStateToProps = (state: IRootState) => ({
  configStatus: configSelectors.status(state),
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector>{

}

function Layout({ children, configStatus }: React.PropsWithChildren<IProps>) {
  return (
    <>
      <main className="main-section">
        <Header key={configStatus} />
        {children}
      </main>
    </>
  )
}

export default connector(Layout)
