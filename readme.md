<!-- INITIAL PRISMA FOR PROJECT -->
```
go get github.com/steebchen/prisma-client-go

<run at specific service (cd to service path that want to run)>
go run github.com/steebchen/prisma-client-go generate --schema=./internal/store/prisma/schema.prisma dev
go mod tidy
```
