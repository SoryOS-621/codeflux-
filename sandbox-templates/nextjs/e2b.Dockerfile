# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
# Fix Windows CRLF line endings → Linux LF, then make executable
RUN sed -i 's/\r$//' /compile_page.sh && chmod +x /compile_page.sh

# Build Next.js + shadcn in /tmp to avoid Docker layer leftovers in /home/user
WORKDIR /tmp/nextjs-app

RUN npx --yes create-next-app@15.3.3 . --yes

RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force
RUN npx --yes shadcn@2.6.3 add --all --yes

# Move everything (including dotfiles) to /home/user — e2b's default cwd
# Using /tmp avoids Docker whiteout files (.wh.*) leaking into /home/user
RUN cp -a /tmp/nextjs-app/. /home/user/ && rm -rf /tmp/nextjs-app

WORKDIR /home/user
