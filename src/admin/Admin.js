import { useEffect } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Row } from "antd";
// import { Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import React, { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router, useHistory } from "react-router-dom";
import Cookies from "universal-cookie";
import PageDataset from "./pages/Dataset";
// import PageLogin from './pages/Login'
// import PageUsers from './pages/Users'
// import PageUser from './pages/User'
import Layout from "./components/Layout";
import { useAuthorization } from "./utils/hooks";

const cookies = new Cookies();

function Admin({ match }) {
  //   const navigate = useNavigate()
  //   const location = useLocation()
//   const history = useHistory();

//   const isLoginPage = location.pathname === "admin/login";

  const token = cookies.get("token");
  const u_hash = cookies.get("u_hash");

  //   const tokensString = localStorage.getItem("tokens");
  //   const tokens = tokensString ? JSON.parse(tokensString) : {};
  //   const { token, u_hash } = tokens;

  const user = useAuthorization({ token, u_hash });

//   useEffect(() => {
//     if (user.isLoading) return;
//     const role = user.data?.u_role;
//     if (!role) {
//       history.push("/", { replace: true });
//     }
//     //   else if (isLoginPage) {
//     //     history.push(role === '4' ? '/users' : '/tickets', { replace: true })
//     //   }
//   }, [user.isLoading, user.data?.u_role, isLoginPage]);

  //   if ((user.isLoading || !user.data?.authorized) && !isLoginPage) {
  //     return (
  //       <Row style={{ height: '100vh' }} justify='center' align='middle'>
  //         {/* <LoadingOutlined style={{ fontSize: '64px' }} /> */}
  //       </Row>
  //     )
  //   }

  //   return (
  //     <div className='App'>
  //       <Routes>
  //         <Route path='/' element={<Layout user={user.data} refetchUser={user.refetch} />}>
  //           <Route path='/users' element={<PageUsers />} />
  //           <Route path='/users/:id' element={<PageUser />} />
  //           <Route path='/metaadm/:selectionId/:itemId?' element={<PageDataset user={user.data} />} />
  //           <Route path='/metaadm/:parentId/list/:selectionId/:itemId?' element={<PageDataset user={user.data} />} />
  //           <Route path='/metabase/:selectionId/:itemId?' element={<PageDataset user={user.data} />} />
  //           <Route path='/makesense' element={
  //             <div style={{ height: 'calc(100vh - 64px)' }}>
  //               <iframe width='100%' height='100%'  src='https://www.makesense.ai/' />
  //             </div>
  //           } />
  //         </Route>
  //         <Route path='/login' element={<PageLogin />} />
  //       </Routes>
  //     </div>
  //   )
  if (user.isLoading) return <div>Loading...</div>;
  if (!user.data?.authorized) return <Redirect to="/" />;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Layout user={user.data} refetchUser={user.refetch}>
          <Switch>
            <Route
              path={`${match.url}/metaadm/:selectionId/:itemId?`}
              component={() => <PageDataset user={user.data} />}
            />
            <Route
              path={`${match.url}/metaadm/:parentId/list/:selectionId/:itemId?`}
              component={() => <PageDataset user={user.data} />}
            />
            <Route
              path={`${match.url}/metabase/:selectionId/:itemId?`}
              component={() => <PageDataset user={user.data} />}
            />
            {/* <Route path='/makesense' render={() => (
                <div style={{ height: 'calc(100vh - 64px)' }}>
                  <iframe width='100%' height='100%' frameBorder='0' src='https://www.makesense.ai/' />
                </div>
              )} /> */}
            {/* </Route> */}
          </Switch>
        </Layout>
        {/* <Route path='admin/login' Redirect={{ to: '/' }} /> */}
      </Switch>
    </Suspense>
  );
}

export default Admin;
