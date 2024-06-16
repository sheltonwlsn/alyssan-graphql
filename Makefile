docker-build:
	docker build --build-arg BUILD_TYPE="" -t europe-west9-docker.pkg.dev/workmate-ai/alyssan/alyssan-graph . --target release

docker-push:
	docker push europe-west9-docker.pkg.dev/workmate-ai/alyssan/alyssan-graph

create-types-module:
	rsync -a --prune-empty-dirs --include '*/' --include '*.d.ts' --exclude '*' ./src/shared/typegraphql/ ./appTypes/

sync-types:
	rsync -a --prune-empty-dirs --include '*/' --include '*.d.ts' --exclude '*' ./types/ ../frontend/types/