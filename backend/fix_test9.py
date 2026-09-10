with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("logger: false", "logger: ['error', 'warn']")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

