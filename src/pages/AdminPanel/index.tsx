import React from "react";
import "./styles.scss";
import Layout from "../../components/Layout";
import Admin from "../../admin/Admin";



const AdminPanel = () => {
  
    // return <div>Panel</div>}
  return (
    // <Admin match={{ url: "/admin", path: "/admin" }}/>
      <Layout>
        {/* <iframe src="https://admin-boilerplate.vercel.app/"></iframe> */}
        <Admin match={{ url: "/admin", path: "/admin" }}/>
      </Layout>
  );
};

export default AdminPanel
