#!/usr/bin/env python3
from pathlib import Path
from subprocess import run
from venv import EnvBuilder

PACKAGES = [
    "sphinx",
    "sphinx-js",
    "/home/maxmouchet/Clones/sphinx-plugins"
    # "https://github.com/maxmouchet/sphinx-plugins/archive/master.zip",
]

DOCS_PATH = Path(__file__).resolve().parent
VENV_PATH = DOCS_PATH.joinpath("venv")


def create_env(path):
    print(f"Creating virtualenv in {path}...")
    builder = EnvBuilder(with_pip=True)
    builder.create(path)


def install_deps(path, packages):
    print(f"Installing dependencies...")
    pip = path.joinpath("bin", "pip")
    run([pip, "install", *packages], check=True)


def build_docs(venv_path, docs_path):
    python = venv_path.joinpath("bin", "python")
    run(
        [python, "-m", "sphinx", "-b", "html", ".", "_build"], cwd=docs_path, check=True
    )


def main():
    print(f"Documentation: {DOCS_PATH}")

    if not VENV_PATH.exists():
        create_env(VENV_PATH)
        install_deps(VENV_PATH, PACKAGES)

    build_docs(VENV_PATH, DOCS_PATH)


if __name__ == "__main__":
    main()
