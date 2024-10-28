# REASER_API_Feeds  

EN : This is a simple API for managing RSS feeds. It allows you to create, read, update, delete, and filter feeds by their category.  

ES : Esta es una API sencilla para gestionar feeds RSS. Permite crear, leer, actualizar, eliminar y filtrar feeds según su categoría.

## Features | Funcionalidades

- **Add a new feed | Agregar un nuevo feed**
- **Get all feeds | Obtener todos los feeds**
- **Update an existing feed | Actualizar un feed existente**
- **Delete a feed | Eliminar un feed**
- **Filter feeds by category | Filtrar feeds por categoría**

## Available Endpoints | Endpoints Disponibles

| Method | Endpoint             | Description (EN)                          | Descripción (ES)                        |
|--------|----------------------|------------------------------------------|-----------------------------------------|
| POST   | `/api/addfeed`      | Add a new feed to the collection.       | Agregar un nuevo feed a la colección.  |
| GET    | `/api/myfeeds`      | Retrieve all feeds from the collection. | Obtener todos los feeds de la colección.|
| PUT    | `/api/myfeeds/:id`  | Update an existing feed by ID.          | Actualizar un feed existente por ID.   |
| DELETE | `/api/myfeeds/:id`  | Delete a feed by ID.                    | Eliminar un feed por ID.               |
| GET    | `/api/myfeeds/filter`| Filter feeds by category.               | Filtrar feeds por categoría.           |

## Technologies Used | Tecnologías Usadas

- [Node.js](https://nodejs.org/) - JavaScript runtime environment
- [Express](https://expressjs.com/) - Web framework for building applications
- [TypeScript](https://www.typescriptlang.org/) - A superset of JavaScript

## Installation | Instalación

### Prerequisites | Prerequisitos

- [Node.js](https://nodejs.org/) - (recommended latest LTS version)
- [npm](https://www.npmjs.com/) - Package manager for Node.js

### Clone the repository | Clonar el repositorio

```bash
git clone https://github.com/soydeif/REASER_API.git
cd REASER_API
