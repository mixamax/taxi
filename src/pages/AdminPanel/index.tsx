import React from "react";
import "./styles.scss";
import Layout from "../../components/Layout";
import Admin from "../../admin/Admin";



const AdminPanel = () => {
  
  return (
      <Layout>
        <Admin match={{ url: "/admin", path: "/admin" }}/>
      </Layout>
  );
};

export default AdminPanel
