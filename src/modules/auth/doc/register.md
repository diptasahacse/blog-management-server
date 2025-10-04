## How register works
1. User sends a POST request to `/auth/register` with the following body:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123"
}
```
2. The server receives the request and validates the input data.
3. If the input data is valid, the data passed to the register method in auth service. 
4. In Register method
    1. 