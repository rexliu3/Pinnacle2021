from spotcrime import SpotCrime
import requests

# UCLA coordinates
ucla = (34.0689, -118.4452)

# radius
radius = 100


sc = SpotCrime(ucla, radius, None, ['Other'], "your-api-key", days=10)
for incident in sc.get_incidents():
    print(incident)
