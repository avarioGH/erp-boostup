import re

with open('src/inventory/inventory.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r"throw new BadRequestException\(Insufficient available stock for product  \+ params\.productId\);", "throw new BadRequestException('Insufficient available stock for product ' + params.productId);", c)
c = re.sub(r"throw new BadRequestException\(Insufficient available stock to reserve for product  \+ params\.productId\);", "throw new BadRequestException('Insufficient available stock to reserve for product ' + params.productId);", c)
c = re.sub(r"throw new BadRequestException\(Concurrency conflict reserving stock for product  \+ params\.productId\);", "throw new BadRequestException('Concurrency conflict reserving stock for product ' + params.productId);", c)
c = re.sub(r"throw new BadRequestException\(Concurrency conflict releasing reservation for product  \+ params\.productId\);", "throw new BadRequestException('Concurrency conflict releasing reservation for product ' + params.productId);", c)

with open('src/inventory/inventory.service.ts', 'w') as f:
    f.write(c)
