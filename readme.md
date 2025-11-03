<!-- INITIAL PRISMA FOR PROJECT -->
```
go get github.com/steebchen/prisma-client-go

<run at specific service (cd to service path that want to run)>
go run github.com/steebchen/prisma-client-go generate --schema=./internal/store/prisma/schema.prisma dev
go mod tidy
```

test get pin image
```
data:image/png;base64,<your_base64>
```
ex: if get this

"image": "iVBORw0KGgoAAAANSUhEUgAAAZMAAAIOCAYAAAB9DOBhAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwA..."
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZMAAAIOCAYAAAB9DOBhAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwA...
```