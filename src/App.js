import React, { useState, useEffect } from "react";
import "./App.css";
import { API, Storage } from "aws-amplify";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { listTodos } from "./graphql/queries";
import {
	createTodo as createTodoMutation,
	deleteTodo as deleteTodoMutation,
} from "./graphql/mutations";

const initialFormState = { name: "", description: "" };

function App() {
	const [todos, setTodos] = useState([]);
	const [formData, setFormData] = useState(initialFormState);

	useEffect(() => {
		fetchTodos();
	}, []);

	const fetchTodos = async () => {
		const apiData = await API.graphql({ query: listTodos });
		const todosFromAPI = apiData.data.listTodos.items;
		await Promise.all(
			todosFromAPI.map(async (todo) => {
				if (todo.image) {
					const image = await Storage.get(todo.image);
					todo.image = image;
				}
				return todo;
			})
		);
		setTodos(apiData.data.listTodos.items);
	};

	const createTodo = async () => {
		if (!formData.name || !formData.description) return;
		await API.graphql({
			query: createTodoMutation,
			variables: { input: formData },
		});
		if (formData.image) {
			const image = await Storage.get(formData.image);
			formData.image = image;
		}
		setTodos([...todos, formData]);
		setFormData(initialFormState);
	};

	const deleteTodo = async ({ id }) => {
		const newTodosArray = todos.filter((todo) => todo.id !== id);
		setTodos(newTodosArray);
		await API.graphql({
			query: deleteTodoMutation,
			variables: { input: { id } },
		});
	};

	const handleTodoNameChange = (e) => {
		setFormData({ ...formData, name: e.target.value });
	};

	const handleDescriptionChange = (e) => {
		setFormData({ ...formData, description: e.target.value });
	};

	async function onChange(e) {
		if (!e.target.files[0]) return;
		const file = e.target.files[0];
		setFormData({ ...formData, image: file.name });
		await Storage.put(file.name, file);
		fetchTodos();
	}

	return (
		<div className="App">
			<h1>My Todos App</h1>

			<input
				onChange={handleTodoNameChange}
				placeholder="Todo name"
				value={formData.name}
			/>
			<input
				onChange={handleDescriptionChange}
				placeholder="Todo description"
				value={formData.description}
			/>
			<input type="file" onChange={onChange} />
			<button onClick={createTodo}>Create Todo</button>

			<div style={{ marginBottom: 30 }}>
				{todos.map((todo) => (
					<div key={todo.id || todo.name}>
						<h2>{todo.name}</h2>
						<p>{todo.description}</p>
						<button onClick={() => deleteTodo(todo)}>Delete todo</button>
						{todo.image && (
							<img src={todo.image} style={{ width: 400 }} alt="画像" />
						)}
					</div>
				))}
			</div>

			<AmplifySignOut />
		</div>
	);
}

export default withAuthenticator(App);
