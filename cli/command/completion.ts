import { Command } from "commander";

const SUBCOMMANDS = ["create", "list", "info", "add", "doctor", "completion"];
const LANGUAGES = ["node", "python"];
const NODE_DATABASES = ["mysql", "postgresql"];
const PYTHON_DATABASES = ["postgresql", "sqlite"];
const ADDONS = ["docker", "testing", "ci", "husky"];

function bashCompletion(): string {
  return `# archgen bash completion
# Add this to your ~/.bashrc or ~/.bash_profile:
#   source <(archgen completion bash)

_archgen_completion() {
  local cur prev words cword
  _init_completion 2>/dev/null || {
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
  }

  case "\${prev}" in
    archgen)
      COMPREPLY=( $(compgen -W "${SUBCOMMANDS.join(" ")}" -- "\${cur}") )
      return 0
      ;;
    add)
      COMPREPLY=( $(compgen -W "${ADDONS.join(" ")}" -- "\${cur}") )
      return 0
      ;;
    --language|-l)
      COMPREPLY=( $(compgen -W "${LANGUAGES.join(" ")}" -- "\${cur}") )
      return 0
      ;;
    --database)
      COMPREPLY=( $(compgen -W "${[...NODE_DATABASES, ...PYTHON_DATABASES].filter((v, i, a) => a.indexOf(v) === i).join(" ")}" -- "\${cur}") )
      return 0
      ;;
    completion)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- "\${cur}") )
      return 0
      ;;
    info)
      COMPREPLY=( $(compgen -W "${LANGUAGES.join(" ")}" -- "\${cur}") )
      return 0
      ;;
  esac

  local opts="--language --docker --testing --ci --husky --all --author --description --database --force --dry-run --skip-git --output --quiet --verbose --help --version"
  COMPREPLY=( $(compgen -W "\${opts}" -- "\${cur}") )
}

complete -F _archgen_completion archgen
`;
}

function zshCompletion(): string {
  return `#compdef archgen
# archgen zsh completion
# Add this to your ~/.zshrc:
#   source <(archgen completion zsh)

_archgen() {
  local state

  _arguments \\
    '1: :->command' \\
    '*: :->args'

  case \${state} in
    command)
      local commands=(${SUBCOMMANDS.map((c) => `'${c}'`).join(" ")})
      _describe 'command' commands
      ;;
    args)
      case \${words[2]} in
        create)
          _arguments \\
            '(-l --language)'{-l,--language}'[Language]:lang:(${LANGUAGES.join(" ")})' \\
            '--docker[Include Docker setup]' \\
            '--testing[Include testing setup]' \\
            '--ci[Include CI workflow]' \\
            '--husky[Include Husky + lint-staged]' \\
            '--all[Include all addons]' \\
            '(-a --author)'{-a,--author}'[Author name]:name:' \\
            '(-d --description)'{-d,--description}'[Description]:desc:' \\
            '--database[Database type]:db:(${[...NODE_DATABASES, ...PYTHON_DATABASES].filter((v, i, a) => a.indexOf(v) === i).join(" ")})' \\
            '--force[Overwrite existing directory]' \\
            '--dry-run[Preview without creating]' \\
            '--skip-git[Skip git init]' \\
            '(-o --output)'{-o,--output}'[Output directory]:dir:_files -/' \\
            '--quiet[Suppress output]' \\
            '--verbose[Verbose output]'
          ;;
        add)
          _arguments '1:addon:(${ADDONS.join(" ")})' '--dry-run[Preview without writing]'
          ;;
        info)
          _arguments '1:language:(${LANGUAGES.join(" ")})'
          ;;
        completion)
          _arguments '1:shell:(bash zsh fish)'
          ;;
      esac
      ;;
  esac
}

_archgen
`;
}

function fishCompletion(): string {
  const lines: string[] = [
    "# archgen fish completion",
    "# Save to ~/.config/fish/completions/archgen.fish",
    "",
    "# Subcommands",
    ...SUBCOMMANDS.map(
      (c) => `complete -c archgen -f -n '__fish_use_subcommand' -a '${c}'`,
    ),
    "",
    "# create options",
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l language -s l -d 'Language' -r -a '${LANGUAGES.join(" ")}'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l docker -d 'Include Docker setup'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l testing -d 'Include testing setup'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l ci -d 'Include CI workflow'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l husky -d 'Include Husky + lint-staged'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l all -d 'Include all addons'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l author -s a -d 'Author name' -r`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l description -s d -d 'Project description' -r`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l database -d 'Database type' -r -a '${[...NODE_DATABASES, ...PYTHON_DATABASES].filter((v, i, a) => a.indexOf(v) === i).join(" ")}'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l force -d 'Overwrite existing directory'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l dry-run -d 'Preview without creating'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l skip-git -d 'Skip git init'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l output -s o -d 'Output directory' -r -a '(__fish_complete_directories)'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l quiet -d 'Suppress output'`,
    `complete -c archgen -n '__fish_seen_subcommand_from create' -l verbose -d 'Verbose output'`,
    "",
    "# add options",
    `complete -c archgen -n '__fish_seen_subcommand_from add' -f -a '${ADDONS.join(" ")}'`,
    `complete -c archgen -n '__fish_seen_subcommand_from add' -l dry-run -d 'Preview without writing'`,
    "",
    "# info options",
    `complete -c archgen -n '__fish_seen_subcommand_from info' -f -a '${LANGUAGES.join(" ")}'`,
    "",
    "# completion options",
    `complete -c archgen -n '__fish_seen_subcommand_from completion' -f -a 'bash zsh fish'`,
  ];
  return lines.join("\n") + "\n";
}

export const completionCommand = new Command("completion")
  .argument("[shell]", "Shell type: bash | zsh | fish", "bash")
  .description("Output shell completion script")
  .action((shell: string) => {
    switch (shell) {
      case "bash":
        process.stdout.write(bashCompletion());
        break;
      case "zsh":
        process.stdout.write(zshCompletion());
        break;
      case "fish":
        process.stdout.write(fishCompletion());
        break;
      default:
        process.stderr.write(`Unknown shell: ${shell}. Supported: bash, zsh, fish\n`);
        process.exit(1);
    }
  });
