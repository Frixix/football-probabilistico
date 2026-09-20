from src.models.poisson import poisson_probability

def test_poisson_probability():
    # Escenario: Promedio esperado (mu) = 1.8, Goles exactos (k) = 2
    prob = poisson_probability(mu=1.8, k=2)
    
    # Redondeamos el resultado a 5 decimales y afirmamos (assert) que debe ser 0.26778
    assert round(prob, 5) == 0.26778