#!/usr/bin/env bash

set -euo pipefail

repository_root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
sandbox_name=${SANDBOX_NAME:-sbx-kits}
sandbox_agent=${SANDBOX_AGENT:-codex}
community_mise_kit='git+https://github.com/docker/sbx-kits-contrib.git#ref=v0.12.0&dir=mise'
repository_kits=("$repository_root"/kits/*/*)
sandbox_kits=(
	"$community_mise_kit"
	"$repository_root/kits/harness/codex"
	"$repository_root/kits/language/node-npm"
	"$repository_root/kits/mise/network-node"
)
kit_sources='["docker.io/","github.com/docker/"]'

require_sbx() {
	command -v sbx >/dev/null 2>&1 || {
		echo "Docker Sandbox (sbx) is required." >&2
		exit 1
	}
}

validate_kits() {
	DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES=$kit_sources \
		sbx kit validate "$community_mise_kit"

	for kit in "${repository_kits[@]}"; do
		sbx kit validate "$kit"
	done
}

wait_for_node_modules_mount() {
	# The single-quoted script is evaluated by Bash inside the sandbox.
	# shellcheck disable=SC2016
	sbx exec \
		--workdir "$repository_root" \
		"$sandbox_name" \
		bash -c '
			for _ in {1..300}; do
				mountpoint -q "$WORKSPACE_DIR/node_modules" && exit 0
				sleep 0.1
			done
			echo "Timed out waiting for the sandbox-local node_modules mount." >&2
			exit 1
		'
}

setup_repository() {
	wait_for_node_modules_mount
	sbx exec \
		--workdir "$repository_root" \
		"$sandbox_name" \
		mise trust
	sbx exec \
		--workdir "$repository_root" \
		"$sandbox_name" \
		mise run setup
}

require_sbx

case "${1:-}" in
attach)
	setup_repository
	exec sbx run --name "$sandbox_name"
	;;
rebuild)
	validate_kits
	if sbx inspect "$sandbox_name" >/dev/null 2>&1; then
		sbx rm --force "$sandbox_name"
	fi

	create_args=(sbx create --name "$sandbox_name")
	for kit in "${sandbox_kits[@]}"; do
		create_args+=(--kit "$kit")
	done
	DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES=$kit_sources \
		"${create_args[@]}" "$sandbox_agent" "$repository_root"
	setup_repository
	;;
validate)
	validate_kits
	;;
*)
	echo "usage: $0 <attach|rebuild|validate>" >&2
	exit 2
	;;
esac
