import "./App.css";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Card,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Form,
  ButtonGroup,
  Modal,
  Toast,
  Image,
} from "react-bootstrap";
import { BrowserRouter, Route } from "react-router-dom";
// Add Firebase obj
firebase.initializeApp({
  apiKey: "AIzaSyCj6-RxZaniTZeGqH_9cHK9yYbM8vBDhXg",
  authDomain: "toy-store-99bb5.firebaseapp.com",
  databaseURL: "https://toy-store-99bb5.firebaseio.com",
  projectId: "toy-store-99bb5",
  storageBucket: "toy-store-99bb5.appspot.com",
  messagingSenderId: "604747939476",
  appId: "1:604747939476:web:a864a9095a2ff26c5f7e81",
});
// Google Authentication
const auth = firebase.auth();
// Cloud Firestore
const db = firebase.firestore();
const storageRef = firebase.storage().ref();
const provider = new firebase.auth.GoogleAuthProvider();
function App() {
  // const [propAuthState] = useAuthState(auth);
  const [user, loading, error] = useAuthState(auth);
  return (
    <BrowserRouter>
      <div className="App">
        <Route
          exact
          path={"/login"}
          render={(props) => (
            <Login user={user} loading={loading} error={error} {...props} />
          )}
        />
        <Route
          exact
          path={"/shop"}
          render={(props) => <Shop user={user} {...props} />}
        />
        <Route
          exact
          path={"/"}
          render={(props) => (
            <Login user={user} loading={loading} error={error} {...props} />
          )}
        />
      </div>
    </BrowserRouter>
  );
}
const Login = (props) => {
  const { user, loading, error } = props;
  const login = () => {
    auth.signInWithPopup(provider);
  };
  if (loading) {
    return (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      >
        <Spinner animation="grow" size="lg" role="status" variant="primary">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
      </div>
    );
  }
  if (user) {
    props.history.push("/shop");
  }
  return (
    <Container className="text-center">
      <h1 className="display-2 text-danger">
        Welcome to Benjamin Truong's Toy Store
      </h1>
      <p>Please log in to proceed!</p>
      <Button variant="primary" size="lg" onClick={login}>
        Log in
      </Button>
      <Image src="https://i.imgur.com/nloMLw5.gif" style={{height: "300px", marginLeft: "38%"}} className="d-block"/>
    </Container>
  );
};
const Shop = (props) => {
  const { user } = props;
  // const [user, loading, error] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [product, setProduct] = useState([]);
  const [show, setShow] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [inputRef, setInputRef] = useState({ prdName: "", prdDes: "" });
  const [showToast, setShowToast] = useState(false);
  const nameRef = useRef(null);
  const desRef = useRef(null);
  const priceRef = useRef(null);
  const avatarRef = useRef(null);
  const docId = useRef();
  const imgRef = useRef();
  const aod = useRef();
  // Get data from Cloud Firestore
  useEffect(() => {
    let unsubscribe;
    // const usersCollection = await db.collection("store").get();
    unsubscribe = db
      .collection("store")
      .orderBy("createdAt")
      .onSnapshot(
        (querySnapshot) => {
          let updatedProduct = [];
          querySnapshot.forEach((docs) => {
            updatedProduct.push({
              id: docs.id,
              name: docs.data().name,
              description: docs.data().description,
              price: docs.data().price,
              avatar: docs.data().avatar,
              imgName: docs.data().imgName,
            });
          });
          setProduct(updatedProduct);
        },
        (err) => console.log(err)
      );
    // console.log("rendered");
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);
  //Upload img to Firebase Storage
  const onFileChange = async (e) => {
    setLoading(true);
    const file = e.target.files[0];
    // use Firebase Storage to upload files or images
    imgRef.current = file.name;
    const fileRef = storageRef.child(file.name);
    await fileRef.put(file);
    // use the getDownloadURL() to pass the img directive link to the document's img field in the database
    setFileUrl(await fileRef.getDownloadURL());
    setLoading(false);
  };
  //Add data to Cloud Firestore
  const handleChange = (e) => {
    let { name, value } = e.target;
    let updatedValues = {
      ...inputRef,
      [name]: value,
    };
    setInputRef(updatedValues);
  };
  const hanldeAdd = (e) => {
    e.preventDefault();
    let { prdName, prdDes, prdPrice } = inputRef;
    if (!fileUrl) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      return;
    }
    db.collection("store")
      .doc(prdName)
      .set({
        name: prdName,
        avatar: fileUrl,
        price: prdPrice,
        imgName: imgRef.current,
        description: prdDes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        // console.log("Success");
        aod.current = "Add";
        setShowToast(true);
        e.target.reset();
      })
      .catch(() => console.log("Error"));
  };
  // Delete Document in Cloud Firestore
  const handleDelete = (name, imgName) => {
    db.collection("store").doc(name).delete();
    storageRef
      .child(imgName)
      .delete()
      .then(() => {
        // console.log("delete img success");
        aod.current = "Delete";
        setShowToast(true);
      })
      .catch((err) => console.log(err));
  };
  // Logout func
  const logout = () => {
    auth.signOut();
  };
  const handleShow = (docName) => {
    db.collection("store")
      .doc(docName)
      .get()
      .then((doc) => {
        if (doc.exists) {
          nameRef.current.value = doc.data().name;
          desRef.current.value = doc.data().description;
          priceRef.current.value = doc.data().price;
        } else {
          console.log("found none");
        }
      })
      .catch((err) => console.log(err));
  };
  const handleEdit = () => {
    if (avatarRef.current.files.length === 0) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      return;
    }
    db.collection("store")
      .doc(docId.current)
      .update({
        name: nameRef.current.value,
        description: desRef.current.value,
        price: priceRef.current.value,
        avatar: fileUrl,
      })
      .then(() => {
        setShow(false);
      })
      .catch((err) => console.log(err));
  };
  if (!user) {
    props.history.replace("/");
  }
  return (
    <div style={{ position: "relative" }}>
      {showToast ? (
        <Toast
          style={{ position: "fixed", top: "2%", right: "2%" }}
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="mr-auto">Benjamin Truong's Toy Store</strong>
            <small>1s ago</small>
          </Toast.Header>
          <Toast.Body
            className={aod.current === "Add" ? "text-success" : "text-danger"}
          >
            {aod.current} Product Successfully!
          </Toast.Body>
        </Toast>
      ) : null}
      <Container className="my-2">
        {/* Google Auth */}
        <h1>Current User: {user ? user.displayName : ""}</h1>
        <Button variant="danger" onClick={logout}>
          Log out
        </Button>
        {/* Cloud Firestore and Storage (upload file and img) */}
        <Form onSubmit={hanldeAdd}>
          <Form.Group>
            <Form.Label>Product's Name</Form.Label>
            <Form.Control
              name="prdName"
              onChange={handleChange}
              type="text"
              placeholder="Input product's name"
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Product's Description</Form.Label>
            <Form.Control
              name="prdDes"
              onChange={handleChange}
              as="textarea"
              rows={3}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Product's Price</Form.Label>
            <Form.Control
              name="prdPrice"
              onChange={handleChange}
              type="text"
              placeholder="Input product's price"
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.File
              name="prdAvatar"
              onChange={onFileChange}
              id="custom-file"
              label="Choose your product image"
              custom
            />
            {showAlert ? (
              <Alert
                variant="danger"
                onClose={() => setShowAlert(false)}
                dismissible
              >
                You have not chosen an image
              </Alert>
            ) : null}
          </Form.Group>
          {loading ? (
            <Spinner animation="border" role="status" variant="primary">
              <span className="sr-only">Loading...</span>
            </Spinner>
          ) : (
            <Button type="submit" variant="primary">
              Add Product
            </Button>
          )}
        </Form>
        <Row>
          {product.map((item, index) => {
            return (
              <Col key={index} sm={3} className="my-3">
                <Card style={{ height: "400px" }}>
                  <Card.Img
                    style={{ maxHeight: "150px" }}
                    height={200}
                    variant="top"
                    src={item.avatar}
                  />
                  <Card.Header as="b">{item.name}</Card.Header>
                  <Card.Body
                    id="cardBody"
                    style={{
                      overflowY: "scroll",
                    }}
                  >
                    <Card.Text>{item.description}</Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <Card.Text className="font-weight-bold">
                      {item.price}
                    </Card.Text>
                    <ButtonGroup>
                      <Button
                        onClick={() => {
                          docId.current = item.id;
                          handleShow(item.id);
                          setShow(true);
                        }}
                        variant="success"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          handleDelete(item.id, item.imgName);
                        }}
                      >
                        Delete
                      </Button>
                    </ButtonGroup>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
        <Modal
          show={show}
          onHide={() => {
            setShow(false);
          }}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Product's Name</Form.Label>
                <Form.Control
                  ref={nameRef}
                  type="text"
                  placeholder="Input product's name"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Product's Description</Form.Label>
                <Form.Control ref={desRef} as="textarea" rows={3} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Product's Price</Form.Label>
                <Form.Control
                  ref={priceRef}
                  onChange={handleChange}
                  type="text"
                  placeholder="Input product's price"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.File
                  ref={avatarRef}
                  onChange={onFileChange}
                  id="custom-file"
                  label="Choose your product image"
                  custom
                />
                {showAlert ? (
                  <Alert
                    variant="danger"
                    onClose={() => setShowAlert(false)}
                    dismissible
                  >
                    You have not chosen an image
                  </Alert>
                ) : null}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShow(false);
              }}
            >
              Close
            </Button>
            {loading ? (
              <Spinner animation="border" role="status" variant="primary">
                <span className="sr-only">Loading...</span>
              </Spinner>
            ) : (
              <Button onClick={handleEdit} type="submit" variant="primary">
                Save Changes
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default App;
